import { and, asc, desc, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { ZodError } from "zod";
import { db } from "../../../db/index.js";
import { auditLog } from "../../../db/schema/audit-log.js";
import { creatorCategories } from "../../../db/schema/categories.js";
import { creatorEmbeddings } from "../../../db/schema/creator-embeddings.js";
import { creatorScores } from "../../../db/schema/creator-scores.js";
import { creators } from "../../../db/schema/creators.js";
import {
	EMBEDDING_INVALIDATING_FIELDS,
	CreateCreatorSchema,
	CreatorsQuerySchema,
	UpdateCreatorSchema,
	type UpdateCreatorBody,
} from "../../../schemas/creators.js";

// ── Helper ───────────────────────────────────────────────────────────────────

function performedBy(request: { headers: Record<string, string | string[] | undefined> }): string {
	const header = request.headers["x-user-id"];
	return (Array.isArray(header) ? header[0] : header) ?? "anonymous";
}

function zodError(reply: FastifyReply, err: ZodError) {
	return reply.code(400).send({
		statusCode: 400,
		error: "Bad Request",
		message: err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
	});
}

// ── Plugin ───────────────────────────────────────────────────────────────────

export default async function creatorsRoute(app: FastifyInstance) {
	// ─── M1-01  GET /creators ────────────────────────────────────────────────
	app.get(
		"/creators",
		{
			schema: {
				tags: ["creators"],
				summary: "List creators with filters and pagination",
				querystring: {
					type: "object",
					properties: {
						page: { type: "integer", minimum: 1, default: 1 },
						limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
						city: { type: "string" },
						tier: { type: "string", enum: ["nano", "micro", "mid", "macro", "mega"] },
						category: { type: "string" },
						engagement_quality: { type: "string", enum: ["zero", "low", "average", "high", "viral"] },
						followers_min: { type: "integer", minimum: 0 },
						followers_max: { type: "integer", minimum: 0 },
						sort_by: { type: "string", enum: ["score", "followers", "created_at"] },
						sort_order: { type: "string", enum: ["asc", "desc"] },
					},
				},
			},
		},
		async (request, reply) => {
			const parsed = CreatorsQuerySchema.safeParse(request.query);
			if (!parsed.success) return zodError(reply as never, parsed.error);

			const { page, limit, city, tier, engagement_quality, followers_min, followers_max, category, sort_by, sort_order } =
				parsed.data;

			// Build WHERE conditions
			const conditions = and(
				city ? ilike(creators.city, `%${city}%`) : undefined,
				tier ? eq(creators.creatorTier, tier) : undefined,
				engagement_quality ? eq(creators.engagementQuality, engagement_quality) : undefined,
				followers_min !== undefined ? gte(creators.followersCount, followers_min) : undefined,
				followers_max !== undefined ? lte(creators.followersCount, followers_max) : undefined,
			);

			// Resolve category filter: find creator IDs that belong to the category slug
			let categoryCreatorIds: string[] | undefined;
			if (category) {
				const rows = await db
					.select({ creatorId: creatorCategories.creatorId })
					.from(creatorCategories)
					.where(eq(creatorCategories.categorySlug, category));
				categoryCreatorIds = rows.map((r) => r.creatorId);
				// If no creators in that category → return empty immediately
				if (categoryCreatorIds.length === 0) {
					return reply.send({
						data: [],
						pagination: { page, limit, total: 0, pages: 0 },
					});
				}
			}

			const fullConditions = and(
				conditions,
				categoryCreatorIds ? inArray(creators.id, categoryCreatorIds) : undefined,
			);

			// Total count
			const countResult = await db
				.select({ total: sql<number>`count(*)::int` })
				.from(creators)
				.where(fullConditions);
			const total = countResult[0]?.total ?? 0;

			// Paginated rows — left-join score
			const rows = await db
				.select({
					id: creators.id,
					instagramHandle: creators.instagramHandle,
					fullName: creators.fullName,
					country: creators.country,
					city: creators.city,
					followersCount: creators.followersCount,
					engagementRate: creators.engagementRate,
					creatorTier: creators.creatorTier,
					engagementQuality: creators.engagementQuality,
					consistencyScore: creators.consistencyScore,
					campaignsParticipated: creators.campaignsParticipated,
					tags: creators.tags,
					embeddingUpdatedAt: creators.embeddingUpdatedAt,
					createdAt: creators.createdAt,
					updatedAt: creators.updatedAt,
					score: creatorScores.score,
				})
				.from(creators)
				.leftJoin(creatorScores, eq(creatorScores.creatorId, creators.id))
				.where(fullConditions)
				.orderBy(
					sort_by === "score"
						? sort_order === "asc"
							? asc(sql`COALESCE(${creatorScores.score}::numeric, 0)`)
							: desc(sql`COALESCE(${creatorScores.score}::numeric, 0)`)
						: sort_by === "followers"
							? sort_order === "asc"
								? asc(creators.followersCount)
								: desc(creators.followersCount)
							: sort_order === "asc"
								? asc(creators.createdAt)
								: desc(creators.createdAt)
				)
				.limit(limit)
				.offset((page - 1) * limit);

			return reply.send({
				data: rows,
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit),
				},
			});
		},
	);

	// ─── M1-02  GET /creators/:id ────────────────────────────────────────────
	app.get(
		"/creators/:id",
		{
			schema: {
				tags: ["creators"],
				summary: "Get a creator's full profile with score and embedding status",
				params: {
					type: "object",
					required: ["id"],
					properties: { id: { type: "string", format: "uuid" } },
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };

			const [row] = await db
				.select({
					// All creator fields
					id: creators.id,
					instagramHandle: creators.instagramHandle,
					fullName: creators.fullName,
					phone: creators.phone,
					email: creators.email,
					country: creators.country,
					city: creators.city,
					followersCount: creators.followersCount,
					engagementRate: creators.engagementRate,
					avgLikesLast10: creators.avgLikesLast10,
					reachRate: creators.reachRate,
					creatorTier: creators.creatorTier,
					engagementQuality: creators.engagementQuality,
					consistencyScore: creators.consistencyScore,
					audienceQualityScore: creators.audienceQualityScore,
					dataQualityFlags: creators.dataQualityFlags,
					bioText: creators.bioText,
					contentLanguage: creators.contentLanguage,
					dominantFormat: creators.dominantFormat,
					peakActivityHours: creators.peakActivityHours,
					tiktokHandle: creators.tiktokHandle,
					brandMentionsLast30Posts: creators.brandMentionsLast30Posts,
					bioKeywords: creators.bioKeywords,
					contentRateUsd: creators.contentRateUsd,
					paymentMethod: creators.paymentMethod,
					onboardingStatus: creators.onboardingStatus,
					campaignsParticipated: creators.campaignsParticipated,
					notes: creators.notes,
					tags: creators.tags,
					gdprConsentAt: creators.gdprConsentAt,
					embeddingUpdatedAt: creators.embeddingUpdatedAt,
					createdAt: creators.createdAt,
					updatedAt: creators.updatedAt,
					// Score breakdown
					score: creatorScores.score,
					engagementWeight: creatorScores.engagementWeight,
					tierWeight: creatorScores.tierWeight,
					consistencyWeight: creatorScores.consistencyWeight,
					campaignHistoryWeight: creatorScores.campaignHistoryWeight,
					scoreCalculatedAt: creatorScores.calculatedAt,
					scoreVersion: creatorScores.scoreVersion,
					// Embedding status
					embeddingModelId: creatorEmbeddings.modelId,
					embeddingCreatedAt: creatorEmbeddings.createdAt,
				})
				.from(creators)
				.leftJoin(creatorScores, eq(creatorScores.creatorId, creators.id))
				.leftJoin(creatorEmbeddings, eq(creatorEmbeddings.creatorId, creators.id))
				.where(eq(creators.id, id));

			if (!row) {
				return reply.code(404).send({
					statusCode: 404,
					error: "Not Found",
					message: `Creator ${id} not found`,
				});
			}

			return reply.send({
				...row,
				vectorized: row.embeddingModelId !== null,
			});
		},
	);

	// ─── M1-03  POST /creators ───────────────────────────────────────────────
	app.post(
		"/creators",
		{
			schema: {
				tags: ["creators"],
				summary: "Create a new creator",
				body: { type: "object" },
			},
		},
		async (request, reply) => {
			const parsed = CreateCreatorSchema.safeParse(request.body);
			if (!parsed.success) return zodError(reply as never, parsed.error);

			const data = parsed.data;
			const actor = performedBy(request);

			const [creator] = await db.transaction(async (tx) => {
				const inserted = await tx
					.insert(creators)
					.values({
						...data,
						engagementRate: String(data.engagementRate),
						avgLikesLast10: data.avgLikesLast10 !== undefined ? String(data.avgLikesLast10) : undefined,
						reachRate: data.reachRate !== undefined ? String(data.reachRate) : undefined,
						consistencyScore:
							data.consistencyScore !== undefined ? String(data.consistencyScore) : undefined,
						audienceQualityScore:
							data.audienceQualityScore !== undefined
								? String(data.audienceQualityScore)
								: undefined,
						contentRateUsd:
							data.contentRateUsd !== undefined ? String(data.contentRateUsd) : undefined,
						gdprConsentAt: data.gdprConsentAt ? new Date(data.gdprConsentAt) : undefined,
					})
					.returning();

				if (!inserted[0]) throw new Error("Insert returned no rows");

				await tx.insert(auditLog).values({
					entityType: "creator",
					entityId: inserted[0].id,
					action: "created",
					performedBy: actor,
				});

				return inserted;
			});

			return reply.code(201).send(creator);
		},
	);

	// ─── M1-04  PUT /creators/:id ────────────────────────────────────────────
	app.put(
		"/creators/:id",
		{
			schema: {
				tags: ["creators"],
				summary: "Partially update a creator",
				params: {
					type: "object",
					required: ["id"],
					properties: { id: { type: "string", format: "uuid" } },
				},
				body: { type: "object" },
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };

			const parsed = UpdateCreatorSchema.safeParse(request.body);
			if (!parsed.success) return zodError(reply as never, parsed.error);

			const updates = parsed.data;
			const actor = performedBy(request);

			// Fetch current state to diff
			const [current] = await db.select().from(creators).where(eq(creators.id, id));
			if (!current) {
				return reply.code(404).send({
					statusCode: 404,
					error: "Not Found",
					message: `Creator ${id} not found`,
				});
			}

			// Determine if any embedding-invalidating field changed
			const invalidatesEmbedding = (Object.keys(updates) as Array<keyof UpdateCreatorBody>).some(
				(field) => EMBEDDING_INVALIDATING_FIELDS.has(field),
			);

			// Build numeric conversions for Drizzle
			const numericFields = {
				engagementRate: updates.engagementRate !== undefined ? String(updates.engagementRate) : undefined,
				avgLikesLast10: updates.avgLikesLast10 !== undefined ? String(updates.avgLikesLast10) : undefined,
				reachRate: updates.reachRate !== undefined ? String(updates.reachRate) : undefined,
				consistencyScore:
					updates.consistencyScore !== undefined ? String(updates.consistencyScore) : undefined,
				audienceQualityScore:
					updates.audienceQualityScore !== undefined
						? String(updates.audienceQualityScore)
						: undefined,
				contentRateUsd:
					updates.contentRateUsd !== undefined ? String(updates.contentRateUsd) : undefined,
			};

			const updateResult = await db.transaction(async (tx) => {
				const result = await tx
					.update(creators)
					.set({
						...updates,
						...numericFields,
						gdprConsentAt: updates.gdprConsentAt ? new Date(updates.gdprConsentAt) : undefined,
						// Reset embedding queue if needed
						...(invalidatesEmbedding ? { embeddingUpdatedAt: null } : {}),
						updatedAt: new Date(),
					})
					.where(eq(creators.id, id))
					.returning();

				// Write one audit row per changed field
				const auditRows = (Object.keys(updates) as Array<keyof UpdateCreatorBody>)
					.filter((field) => {
						const key = field as keyof typeof current;
						return current[key] !== undefined && String(current[key]) !== String(updates[field]);
					})
					.map((field) => ({
						entityType: "creator" as const,
						entityId: id,
						action: "updated" as const,
						fieldName: field,
						oldValue: String(current[field as keyof typeof current] ?? ""),
						newValue: String(updates[field] ?? ""),
						performedBy: actor,
					}));

				if (auditRows.length > 0) {
					await tx.insert(auditLog).values(auditRows);
				}

				return result;
			});

			return reply.send(updateResult[0]);
		},
	);

	// ─── M1-05  DELETE /creators/:id ────────────────────────────────────────
	app.delete(
		"/creators/:id",
		{
			schema: {
				tags: ["creators"],
				summary: "Delete a creator (hard delete, audit-logged)",
				params: {
					type: "object",
					required: ["id"],
					properties: { id: { type: "string", format: "uuid" } },
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const actor = performedBy(request);

			const [existing] = await db
				.select({ id: creators.id, instagramHandle: creators.instagramHandle })
				.from(creators)
				.where(eq(creators.id, id));

			if (!existing) {
				return reply.code(404).send({
					statusCode: 404,
					error: "Not Found",
					message: `Creator ${id} not found`,
				});
			}

			await db.transaction(async (tx) => {
				// Audit before deletion (record still exists)
				await tx.insert(auditLog).values({
					entityType: "creator",
					entityId: id,
					action: "deleted",
					performedBy: actor,
					newValue: existing.instagramHandle,
				});

				await tx.delete(creators).where(eq(creators.id, id));
			});

			return reply.code(204).send();
		},
	);
}
