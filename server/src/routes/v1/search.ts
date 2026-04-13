import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { and, count, isNotNull, isNull, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { creatorEmbeddings } from "../../db/schema/creator-embeddings.js";
import { creators } from "../../db/schema/creators.js";
import { creatorScores } from "../../db/schema/creator-scores.js";
import { processEmbeddingBatch } from "../../lib/embedding-worker.js";
import { generateEmbedding } from "../../lib/embedding.js";
import { ExtractedFiltersSchema, SearchBodySchema } from "../../schemas/search.js";

export default async function searchRoute(app: FastifyInstance) {
	// ── M4-04  GET /embeddings/status ───────────────────────────────────────────
	app.get(
		"/embeddings/status",
		{
			schema: {
				tags: ["search"],
				summary: "Embedding pipeline status",
				response: {
					200: {
						type: "object",
						properties: {
							total: { type: "integer" },
							vectorized: { type: "integer" },
							pending: { type: "integer" },
							last_run: { type: ["string", "null"] },
						},
					},
				},
			},
		},
		async (_req, reply) => {
			const [[totRow], [vecRow], lastRunRow] = await Promise.all([
				db.select({ n: count() }).from(creators),
				db.select({ n: count() }).from(creators).where(isNotNull(creators.embeddingUpdatedAt)),
				db.select({ updatedAt: creatorEmbeddings.updatedAt })
					.from(creatorEmbeddings)
					.orderBy(sql`${creatorEmbeddings.updatedAt} DESC`)
					.limit(1),
			]);

			const total = Number(totRow?.n ?? 0);
			const vectorized = Number(vecRow?.n ?? 0);

			return reply.send({
				total,
				vectorized,
				pending: total - vectorized,
				last_run: lastRunRow[0]?.updatedAt?.toISOString() ?? null,
			});
		},
	);

	// ── M4-02  POST /embeddings/process — called by pg_cron every 5 min ─────────
	app.post(
		"/embeddings/process",
		{
			schema: {
				tags: ["search"],
				summary: "Process pending creator embeddings (invoked by pg_cron)",
				response: {
					200: {
						type: "object",
						properties: {
							processed: { type: "integer" },
							failed: { type: "integer" },
						},
					},
				},
			},
		},
		async (_req, reply) => {
			const result = await processEmbeddingBatch();
			app.log.info(result, "Embedding batch complete");
			return reply.send({ processed: result.processed, failed: result.failed });
		},
	);

	// ── M4-05  POST /search ──────────────────────────────────────────────────────
	// Hybrid RAG search: LLM filter extraction → hard SQL filter → vector search → hybrid rank
	app.post(
		"/search",
		{
			schema: {
				tags: ["search"],
				summary: "Semantic + filter search over creators",
				body: {
					type: "object",
					required: ["query"],
					properties: {
						query: { type: "string" },
						limit: { type: "integer" },
						filters: { type: "object" },
					},
				},
			},
		},
		async (request, reply) => {
			const body = SearchBodySchema.parse(request.body);

			// ActiveFilters: optional fields used for building SQL conditions.
			// Separate from ExtractedFilters (nullable schema for OpenAI structured outputs).
			// All optionals are explicit `T | undefined` due to exactOptionalPropertyTypes.
			type ActiveFilters = {
				city?: string | undefined;
				tier?: "nano" | "micro" | "mid" | "macro" | "mega" | undefined;
				followers_min?: number | undefined;
				followers_max?: number | undefined;
				engagement_quality?: "zero" | "low" | "average" | "high" | "viral" | undefined;
				category_slugs?: string[] | undefined;
			};

			// Step 1 — Extract hard filters from query via gpt-4o-mini
			let activeFilters: ActiveFilters = body.filters ?? {};
			try {
				const { object } = await generateObject({
					model: openai.chat("gpt-4o-mini"),
					schema: ExtractedFiltersSchema,
					system: `Eres un asistente que extrae filtros estructurados de consultas en lenguaje natural sobre creadores de contenido en Colombia.
Extrae solo los filtros que estén explícitamente mencionados o claramente implícitos.
Si un filtro no aplica, devuelve null. No inventes datos.`,
					prompt: body.query,
				});
				// Strip nulls — null means "not mentioned in query", not "filter by null".
				// LLM-extracted filters take precedence over caller-provided ones.
				const llmFilters = Object.fromEntries(
					Object.entries(object).filter(([, v]) => v !== null),
				) as ActiveFilters;
				activeFilters = { ...(body.filters ?? {}), ...llmFilters };
			} catch (err) {
				// Non-fatal — fallback to vector-only search
				app.log.warn({ err }, "LLM filter extraction failed, proceeding without hard filters");
			}

			// Step 2 — Build WHERE conditions from hard filters.
			// Use the table alias `c` (not Drizzle column refs) — the raw SQL query aliases creators as `c`.
			const conditions = [];
			if (activeFilters.city) {
				conditions.push(sql`LOWER(c.city) LIKE LOWER(${"%" + activeFilters.city + "%"})`);
			}
			if (activeFilters.tier) {
				conditions.push(sql`c.creator_tier = ${activeFilters.tier}`);
			}
			if (activeFilters.engagement_quality) {
				conditions.push(sql`c.engagement_quality = ${activeFilters.engagement_quality}`);
			}
			if (activeFilters.followers_min !== undefined) {
				conditions.push(sql`c.followers_count >= ${activeFilters.followers_min}`);
			}
			if (activeFilters.followers_max !== undefined) {
				conditions.push(sql`c.followers_count <= ${activeFilters.followers_max}`);
			}

			// Step 3 — Generate query embedding
			let queryEmbedding: number[];
			try {
				queryEmbedding = await generateEmbedding(body.query);
			} catch (err) {
				app.log.error({ err }, "OpenAI embedding generation failed");
				return reply.status(502).send({ error: "Embedding service unavailable", detail: err instanceof Error ? err.message : String(err) });
			}
			// Inline the vector literal — postgres.js can't resolve $1::vector casts.
			// Safe to use sql.raw() because the array comes from OpenAI (pure floats, no user input).
			const vectorSql = sql.raw(`'[${queryEmbedding.join(",")}]'::vector`);

			// Step 4 — Hybrid search: cosine distance + normalized score
			// hybrid_score = distance * 0.7 + (1 - score/100) * 0.3
			// Lower hybrid_score = better match
			const whereClause = conditions.length > 0 ? and(...conditions) : sql`TRUE`;

			let rows: Array<{
				id: string;
				instagram_handle: string;
				full_name: string;
				city: string | null;
				creator_tier: string;
				engagement_quality: string;
				followers_count: number;
				engagement_rate: string;
				bio_text: string | null;
				bio_keywords: string[] | null;
				score: string | null;
				distance: number;
				hybrid_score: number;
			}>;
			try {
				rows = await db.execute(sql`
					SELECT
						c.id,
						c.instagram_handle,
						c.full_name,
						c.city,
						c.creator_tier,
						c.engagement_quality,
						c.followers_count,
						c.engagement_rate,
						c.bio_text,
						c.bio_keywords,
						cs.score,
						(ce.embedding <=> ${vectorSql}) AS distance,
						(
							(ce.embedding <=> ${vectorSql}) * 0.7 +
							(1.0 - COALESCE(cs.score::numeric, 50) / 100.0) * 0.3
						) AS hybrid_score
					FROM creators c
					INNER JOIN creator_embeddings ce ON ce.creator_id = c.id
					LEFT JOIN creator_scores cs ON cs.creator_id = c.id
					WHERE ${whereClause}
					ORDER BY hybrid_score ASC
					LIMIT ${body.limit}
				`) as typeof rows;
			} catch (err) {
				const cause = (err as { cause?: { message?: string } })?.cause;
				app.log.error({ pgError: cause?.message ?? String(err) }, "Vector search query failed");
				return reply.status(500).send({
					error: "Vector search failed",
					detail: cause?.message ?? (err instanceof Error ? err.message : String(err)),
				});
			}

			// Step 5 — Check how many creators have embeddings (for fallback warning)
			const [pendingRow] = await db
				.select({ n: count() })
				.from(creators)
				.where(isNull(creators.embeddingUpdatedAt));
			const pendingCount = Number(pendingRow?.n ?? 0);

			return reply.send({
				results: rows.map((r) => ({
					id: r.id,
					instagramHandle: r.instagram_handle,
					fullName: r.full_name,
					city: r.city,
					creatorTier: r.creator_tier,
					engagementQuality: r.engagement_quality,
					followersCount: r.followers_count,
					engagementRate: r.engagement_rate,
					bioText: r.bio_text,
					bioKeywords: r.bio_keywords,
					score: r.score,
					semanticScore: Math.round((1 - Number(r.distance)) * 100) / 100,
				})),
				filtersApplied: activeFilters,
				total: rows.length,
				embeddingsPending: pendingCount,
			});
		},
	);
}
