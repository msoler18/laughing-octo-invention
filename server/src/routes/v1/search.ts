import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { and, count, gte, isNotNull, isNull, lte, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { creatorEmbeddings } from "../../db/schema/creator-embeddings.js";
import { creators } from "../../db/schema/creators.js";
import { creatorScores } from "../../db/schema/creator-scores.js";
import { processEmbeddingBatch } from "../../lib/embedding-worker.js";
import { generateEmbedding } from "../../lib/embedding.js";
import type { ExtractedFilters } from "../../schemas/search.js";
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

			// Step 1 — Extract hard filters from query via gpt-4o-mini
			let extractedFilters: ExtractedFilters = {};
			try {
				const { object } = await generateObject({
					model: openai("gpt-4o-mini"),
					schema: ExtractedFiltersSchema,
					system: `Eres un asistente que extrae filtros estructurados de consultas en lenguaje natural sobre creadores de contenido en Colombia.
Extrae solo los filtros que estén explícitamente mencionados o claramente implícitos.
Si un filtro no aplica, omítelo. No inventes datos.`,
					prompt: body.query,
				});
				extractedFilters = object;
			} catch (err) {
				// Non-fatal — fallback to vector-only search
				app.log.warn({ err }, "LLM filter extraction failed, proceeding without hard filters");
			}

			// Merge caller-provided filters (LLM-extracted take precedence)
			const callerFilters = body.filters ?? {};
			const filters: ExtractedFilters = { ...callerFilters, ...extractedFilters };

			// Step 2 — Build WHERE conditions from hard filters
			const conditions = [];
			if (filters.city) {
				conditions.push(sql`LOWER(${creators.city}) LIKE LOWER(${"%" + filters.city + "%"})`);
			}
			if (filters.tier) {
				conditions.push(sql`${creators.creatorTier} = ${filters.tier}`);
			}
			if (filters.engagement_quality) {
				conditions.push(sql`${creators.engagementQuality} = ${filters.engagement_quality}`);
			}
			if (filters.followers_min !== undefined) {
				conditions.push(gte(creators.followersCount, filters.followers_min));
			}
			if (filters.followers_max !== undefined) {
				conditions.push(lte(creators.followersCount, filters.followers_max));
			}

			// Step 3 — Generate query embedding in parallel with SQL prep
			const queryEmbedding = await generateEmbedding(body.query);
			const vectorStr = `[${queryEmbedding.join(",")}]`;

			// Step 4 — Hybrid search: cosine distance + normalized score
			// hybrid_score = distance * 0.7 + (1 - score/100) * 0.3
			// Lower hybrid_score = better match
			const whereClause = conditions.length > 0 ? and(...conditions) : sql`TRUE`;

			const rows = await db.execute<{
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
			}>(sql`
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
					(ce.embedding <=> ${vectorStr}::vector) AS distance,
					(
						(ce.embedding <=> ${vectorStr}::vector) * 0.7 +
						(1.0 - COALESCE(cs.score::numeric, 50) / 100.0) * 0.3
					) AS hybrid_score
				FROM creators c
				INNER JOIN creator_embeddings ce ON ce.creator_id = c.id
				LEFT JOIN creator_scores cs ON cs.creator_id = c.id
				WHERE ${whereClause}
				ORDER BY hybrid_score ASC
				LIMIT ${body.limit}
			`);

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
				filtersApplied: filters,
				total: rows.length,
				embeddingsPending: pendingCount,
			});
		},
	);
}
