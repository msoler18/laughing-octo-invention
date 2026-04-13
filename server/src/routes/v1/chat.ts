import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, jsonSchema, stepCountIs, streamText } from "ai";
import { and, eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../../db/index.js";
import { campaignCreators } from "../../db/schema/campaign-creators.js";
import { campaigns } from "../../db/schema/campaigns.js";
import { creatorEmbeddings } from "../../db/schema/creator-embeddings.js";
import { creatorScores } from "../../db/schema/creator-scores.js";
import { creators } from "../../db/schema/creators.js";
import { generateEmbedding } from "../../lib/embedding.js";

// ── M6-05  System prompt ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres el asistente IA de RealUp, una plataforma de gestión de campañas de crowdposting en Colombia.

## Tu rol
Ayudas al equipo de operaciones a encontrar creadores, analizar el estado de campañas y descubrir creadores similares.
Respondes en español colombiano, de forma concisa y orientada a la acción.

## Capacidades disponibles
- **searchCreators**: busca creadores por descripción semántica + filtros (ciudad, tier, engagement, seguidores). Úsalo cuando el usuario pida creadores con ciertas características.
- **queryCampaign**: consulta el estado actual de las asignaciones de una campaña (quiénes publicaron, cuántos están en cada estado, quiénes no han confirmado, etc.).
- **findSimilarCreators**: dado un creador, encuentra los N más similares por perfil y contenido.

## Restricciones estrictas
- NUNCA reveles ni accedas a datos de teléfono o email de creadores. Estos campos no están disponibles.
- NUNCA inventes datos, scores, seguidores ni métricas que no vengan de las herramientas.
- Cita siempre la fuente de los datos (tool que se usó).
- Si no tienes suficiente información para responder con precisión, dilo claramente.
- Si el usuario pregunta algo fuera de tu alcance (datos financieros, legales, etc.), redirige amablemente.

## Formato
- Usa listas cuando hay múltiples creadores.
- Para campañas, muestra conteos por estado.
- Cuando muestres un creador, incluye: nombre, @handle, tier, ciudad y score si lo tienes.`;

// ── Tool parameter schemas ────────────────────────────────────────────────────

const SearchCreatorsParams = z.object({
	query: z
		.string()
		.describe(
			"Descripción del perfil de creador buscado (en lenguaje natural)",
		),
	city: z.string().optional().describe("Filtrar por ciudad colombiana"),
	tier: z.enum(["nano", "micro", "mid", "macro", "mega"]).optional(),
	engagement_quality: z
		.enum(["zero", "low", "average", "high", "viral"])
		.optional(),
	followers_min: z.number().int().optional(),
	followers_max: z.number().int().optional(),
	limit: z.number().int().min(1).max(20).default(10),
});

const QueryCampaignParams = z.object({
	campaignId: z.string().uuid(),
	status: z
		.enum([
			"prospecto",
			"contactado",
			"confirmado",
			"en_brief",
			"contenido_enviado",
			"aprobado",
			"publicado",
			"verificado",
			"pagado",
		])
		.optional(),
});

const FindSimilarCreatorsParams = z.object({
	creatorId: z.string().uuid(),
	limit: z.number().int().min(1).max(10).default(5),
	excludeCampaignId: z.string().uuid().optional(),
});

// ── Tool execute functions ────────────────────────────────────────────────────

async function execSearchCreators(
	params: z.infer<typeof SearchCreatorsParams>,
) {
	const {
		query,
		city,
		tier,
		engagement_quality,
		followers_min,
		followers_max,
		limit,
	} = params;

	const queryEmbedding = await generateEmbedding(query);
	const vectorSql = sql.raw(`'[${queryEmbedding.join(",")}]'::vector`);

	// Build filter fragments using Drizzle sql tag
	const filterParts = [];
	if (city) filterParts.push(sql`LOWER(c.city) LIKE LOWER(${`%${city}%`})`);
	if (tier) filterParts.push(sql`c.creator_tier = ${tier}`);
	if (engagement_quality)
		filterParts.push(sql`c.engagement_quality = ${engagement_quality}`);
	if (followers_min !== undefined)
		filterParts.push(sql`c.followers_count >= ${followers_min}`);
	if (followers_max !== undefined)
		filterParts.push(sql`c.followers_count <= ${followers_max}`);

	const filterClause =
		filterParts.length > 0
			? sql` AND ${sql.join(filterParts, sql` AND `)}`
			: sql``;

	const rows = await db.execute<{
		id: string;
		instagram_handle: string;
		full_name: string;
		city: string | null;
		creator_tier: string;
		engagement_quality: string;
		followers_count: number;
		engagement_rate: string;
		score: string | null;
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
			cs.score
		FROM creators c
		INNER JOIN creator_embeddings ce ON ce.creator_id = c.id
		LEFT JOIN creator_scores cs ON cs.creator_id = c.id
		WHERE (ce.embedding <=> ${vectorSql}) < 0.8
		${filterClause}
		ORDER BY (
			(ce.embedding <=> ${vectorSql}) * 0.7 +
			(1.0 - COALESCE(cs.score::numeric, 50) / 100.0) * 0.3
		) ASC
		LIMIT ${limit}
	`);

	return {
		results: rows.map((r) => ({
			id: r.id,
			instagramHandle: r.instagram_handle,
			fullName: r.full_name,
			city: r.city,
			tier: r.creator_tier,
			engagementQuality: r.engagement_quality,
			followersCount: r.followers_count,
			engagementRate: parseFloat(r.engagement_rate).toFixed(1),
			score: r.score ? parseFloat(r.score).toFixed(0) : null,
		})),
		total: rows.length,
	};
}

async function execQueryCampaign(params: z.infer<typeof QueryCampaignParams>) {
	const { campaignId, status } = params;

	const [campaign] = await db
		.select({ id: campaigns.id, name: campaigns.name, brand: campaigns.brand })
		.from(campaigns)
		.where(eq(campaigns.id, campaignId));

	if (!campaign) return { error: `Campaña ${campaignId} no encontrada` };

	const rows = await db
		.select({
			assignmentStatus: campaignCreators.assignmentStatus,
			fullName: creators.fullName,
			instagramHandle: creators.instagramHandle,
			creatorTier: creators.creatorTier,
			city: creators.city,
			score: creatorScores.score,
			statusUpdatedAt: campaignCreators.statusUpdatedAt,
			postUrl: campaignCreators.postUrl,
		})
		.from(campaignCreators)
		.innerJoin(creators, eq(creators.id, campaignCreators.creatorId))
		.leftJoin(
			creatorScores,
			eq(creatorScores.creatorId, campaignCreators.creatorId),
		)
		.where(
			and(
				eq(campaignCreators.campaignId, campaignId),
				status ? eq(campaignCreators.assignmentStatus, status) : undefined,
			),
		)
		.orderBy(
			campaignCreators.assignmentStatus,
			campaignCreators.statusUpdatedAt,
		);

	const counts: Record<string, number> = {};
	for (const r of rows)
		counts[r.assignmentStatus] = (counts[r.assignmentStatus] ?? 0) + 1;

	return {
		campaign: { id: campaign.id, name: campaign.name, brand: campaign.brand },
		totalAssigned: rows.length,
		statusCounts: counts,
		assignments: rows.map((r) => ({
			fullName: r.fullName,
			instagramHandle: r.instagramHandle,
			tier: r.creatorTier,
			city: r.city,
			status: r.assignmentStatus,
			score: r.score ? parseFloat(r.score).toFixed(0) : null,
			hasPostUrl: r.postUrl !== null,
			statusUpdatedAt: r.statusUpdatedAt?.toISOString(),
		})),
	};
}

async function execFindSimilarCreators(
	params: z.infer<typeof FindSimilarCreatorsParams>,
) {
	const { creatorId, limit, excludeCampaignId } = params;

	const [ref] = await db
		.select({
			fullName: creators.fullName,
			instagramHandle: creators.instagramHandle,
			embedding: creatorEmbeddings.embedding,
		})
		.from(creators)
		.innerJoin(creatorEmbeddings, eq(creatorEmbeddings.creatorId, creators.id))
		.where(eq(creators.id, creatorId));

	if (!ref)
		return { error: `Creador ${creatorId} no encontrado o sin embedding` };

	let excludeIds: string[] = [creatorId];
	if (excludeCampaignId) {
		const assigned = await db
			.select({ creatorId: campaignCreators.creatorId })
			.from(campaignCreators)
			.where(eq(campaignCreators.campaignId, excludeCampaignId));
		excludeIds = [...excludeIds, ...assigned.map((a) => a.creatorId)];
	}

	const refVectorSql = sql.raw(`'[${ref.embedding.join(",")}]'::vector`);

	const rows = await db.execute<{
		id: string;
		instagram_handle: string;
		full_name: string;
		city: string | null;
		creator_tier: string;
		followers_count: number;
		score: string | null;
		distance: number;
	}>(sql`
		SELECT
			c.id,
			c.instagram_handle,
			c.full_name,
			c.city,
			c.creator_tier,
			c.followers_count,
			cs.score,
			(ce.embedding <=> ${refVectorSql}) AS distance
		FROM creators c
		INNER JOIN creator_embeddings ce ON ce.creator_id = c.id
		LEFT JOIN creator_scores cs ON cs.creator_id = c.id
		WHERE c.id != ${creatorId}
		AND c.id NOT IN (${sql.join(
			excludeIds.map((id) => sql`${id}`),
			sql`, `,
		)})
		ORDER BY distance ASC
		LIMIT ${limit}
	`);

	return {
		referenceCreator: {
			fullName: ref.fullName,
			instagramHandle: ref.instagramHandle,
		},
		similar: rows.map((r) => ({
			id: r.id,
			instagramHandle: r.instagram_handle,
			fullName: r.full_name,
			city: r.city,
			tier: r.creator_tier,
			followersCount: r.followers_count,
			score: r.score ? parseFloat(r.score).toFixed(0) : null,
			similarity: Math.round((1 - Number(r.distance)) * 100),
		})),
	};
}

// ── M6-02/03/04  Tool definitions ────────────────────────────────────────────
// ai package reads tool.parameters via asSchema() — requires a jsonSchema() wrapper
// so the Schema symbol is recognized. @ai-sdk/openai then reads the resulting inputSchema.
// Plain objects with jsonSchema() in parameters, cast to any to bypass Zod v4 TS issues.

// biome-ignore lint/suspicious/noExplicitAny: jsonSchema<unknown> + Zod v4 TS incompatibility
const TOOLS: Record<string, any> = {
	searchCreators: {
		description:
			"Busca creadores de contenido usando búsqueda semántica + filtros. Devuelve los más relevantes con su score.",
		inputSchema: jsonSchema({
			type: "object",
			properties: {
				query: { type: "string", description: "Descripción del perfil de creador buscado (lenguaje natural)" },
				city: { type: "string", description: "Ciudad colombiana para filtrar (ej: Bogotá, Medellín)" },
				tier: { type: "string", enum: ["nano", "micro", "mid", "macro", "mega"], description: "Tier por seguidores" },
				engagement_quality: { type: "string", enum: ["zero", "low", "average", "high", "viral"] },
				followers_min: { type: "integer", minimum: 0 },
				followers_max: { type: "integer", minimum: 0 },
				limit: { type: "integer", minimum: 1, maximum: 20, default: 10 },
			},
			required: ["query"],
		}),
		execute: async (params: unknown) => execSearchCreators(SearchCreatorsParams.parse(params)),
	},
	queryCampaign: {
		description:
			"Consulta el estado de las asignaciones de una campaña: quiénes están en cada etapa, quiénes publicaron, quiénes no respondieron, etc.",
		inputSchema: jsonSchema({
			type: "object",
			properties: {
				campaignId: { type: "string", format: "uuid", description: "ID de la campaña a consultar" },
				status: {
					type: "string",
					enum: ["prospecto", "contactado", "confirmado", "en_brief", "contenido_enviado", "aprobado", "publicado", "verificado", "pagado"],
					description: "Filtrar por estado específico (opcional)",
				},
			},
			required: ["campaignId"],
		}),
		execute: async (params: unknown) => execQueryCampaign(QueryCampaignParams.parse(params)),
	},
	findSimilarCreators: {
		description:
			"Dado un creador, encuentra los N más parecidos en perfil y contenido. Útil para alternativas o reemplazos.",
		inputSchema: jsonSchema({
			type: "object",
			properties: {
				creatorId: { type: "string", format: "uuid", description: "ID del creador de referencia" },
				limit: { type: "integer", minimum: 1, maximum: 10, default: 5 },
				excludeCampaignId: { type: "string", format: "uuid", description: "Excluir creadores ya asignados a esta campaña" },
			},
			required: ["creatorId"],
		}),
		execute: async (params: unknown) => execFindSimilarCreators(FindSimilarCreatorsParams.parse(params)),
	},
};

// ── M6-01  POST /api/v1/chat ──────────────────────────────────────────────────

// AI SDK v6 sends UIMessage format — content is in `parts`, not as a top-level string.
// Use passthrough() to allow extra fields (id, parts, createdAt, etc.) and make content optional.
const ChatBodySchema = z.object({
	messages: z
		.array(
			z.object({ role: z.enum(["user", "assistant"]) }).passthrough(),
		)
		.min(1),
	campaignId: z.string().uuid().optional(),
});

export default async function chatRoute(app: FastifyInstance) {
	app.post(
		"/chat",
		{
			schema: {
				tags: ["chat"],
				summary:
					"Streaming AI chat with creator search and campaign query tools",
				body: {
					type: "object",
					required: ["messages"],
					properties: {
						messages: { type: "array" },
						campaignId: { type: "string" },
					},
				},
			},
		},
		async (request, reply) => {
			const parsed = ChatBodySchema.safeParse(request.body);
			if (!parsed.success) {
				return reply.code(400).send({
					statusCode: 400,
					error: "Bad Request",
					message: parsed.error.issues
						.map((e) => `${e.path.join(".")}: ${e.message}`)
						.join("; "),
				});
			}

			const { messages, campaignId } = parsed.data;

			const systemPrompt = campaignId
				? `${SYSTEM_PROMPT}\n\n## Contexto actual\nEl usuario está trabajando en la campaña con ID: ${campaignId}. Puedes usar este ID directamente en queryCampaign sin pedirlo.`
				: SYSTEM_PROMPT;

			// M6-06 — rate limit / service degradation handling
			// biome-ignore lint/suspicious/noExplicitAny: AI SDK v6 + Zod v4 tool type mismatch
			let result: any;
			try {
				// biome-ignore lint/suspicious/noExplicitAny: see above
				result = streamText({
					model: openai.chat("gpt-4o-mini"),
					system: systemPrompt,
					// biome-ignore lint/suspicious/noExplicitAny: convertToModelMessages handles UIMessage → CoreMessage
					messages: await convertToModelMessages(messages as any),
					// biome-ignore lint/suspicious/noExplicitAny: tool() with jsonSchema<unknown> requires cast
					tools: TOOLS as any,
					stopWhen: stepCountIs(5),
					onError: ({ error }) => {
						app.log.error({
							msg: error instanceof Error ? error.message : String(error),
							stack: error instanceof Error ? error.stack : undefined,
							cause: error instanceof Error && error.cause ? String(error.cause) : undefined,
						}, "[chat] streamText error");
					},
				});
			} catch (err) {
				const anyErr = err as { status?: number };
				if (anyErr?.status === 429 || anyErr?.status === 503) {
					return reply.code(503).header("Retry-After", "30").send({
						statusCode: 503,
						error: "Service Unavailable",
						message:
							"El modelo de IA está momentáneamente sobrecargado. Intenta en 30 segundos.",
					});
				}
				throw err;
			}

			reply.hijack();
			result.pipeUIMessageStreamToResponse(reply.raw, {
				headers: {
					"Access-Control-Allow-Origin": request.headers.origin ?? "*",
					"Cache-Control": "no-cache, no-transform",
				},
			});
		},
	);
}
