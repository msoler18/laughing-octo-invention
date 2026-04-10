import { and, eq, inArray, sql } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { ZodError } from "zod";
import { db } from "../../../db/index.js";
import { auditLog } from "../../../db/schema/audit-log.js";
import { campaignCreators } from "../../../db/schema/campaign-creators.js";
import { campaigns } from "../../../db/schema/campaigns.js";
import { creatorScores } from "../../../db/schema/creator-scores.js";
import { creators } from "../../../db/schema/creators.js";
import {
	ASSIGNMENT_STATUSES,
	BulkAssignSchema,
	CreateCampaignSchema,
	UpdateCampaignSchema,
} from "../../../schemas/campaigns.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// Returns one count column per assignment status using FILTER aggregation.
// Reused in both list and detail endpoints.
function pipelineStatColumns() {
	return Object.fromEntries(
		ASSIGNMENT_STATUSES.map((status) => [
			status.replace(/-/g, "_"),
			sql<number>`count(${campaignCreators.id}) FILTER (WHERE ${campaignCreators.assignmentStatus} = ${status})::int`,
		]),
	) as Record<string, ReturnType<typeof sql<number>>>;
}

// ── Plugin ───────────────────────────────────────────────────────────────────

export default async function campaignsRoute(app: FastifyInstance) {
	// ─── M1-06  GET /campaigns ───────────────────────────────────────────────
	app.get(
		"/campaigns",
		{
			schema: {
				tags: ["campaigns"],
				summary: "List all campaigns with lifecycle counters",
			},
		},
		async (_request, reply) => {
			const rows = await db
				.select({
					id: campaigns.id,
					name: campaigns.name,
					brand: campaigns.brand,
					description: campaigns.description,
					startDate: campaigns.startDate,
					endDate: campaigns.endDate,
					status: campaigns.status,
					targetCreatorCount: campaigns.targetCreatorCount,
					createdAt: campaigns.createdAt,
					updatedAt: campaigns.updatedAt,
					// Total assigned + per-status counts
					totalAssigned: sql<number>`count(${campaignCreators.id})::int`,
					...pipelineStatColumns(),
				})
				.from(campaigns)
				.leftJoin(campaignCreators, eq(campaignCreators.campaignId, campaigns.id))
				.groupBy(campaigns.id)
				.orderBy(campaigns.createdAt);

			return reply.send({ data: rows });
		},
	);

	// ─── M1-07  GET /campaigns/:id ───────────────────────────────────────────
	app.get(
		"/campaigns/:id",
		{
			schema: {
				tags: ["campaigns"],
				summary: "Campaign detail with assignments and pipeline stats",
				params: {
					type: "object",
					required: ["id"],
					properties: { id: { type: "string", format: "uuid" } },
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };

			// Campaign + pipeline stats
			const [campaign] = await db
				.select({
					id: campaigns.id,
					name: campaigns.name,
					brand: campaigns.brand,
					description: campaigns.description,
					briefText: campaigns.briefText,
					startDate: campaigns.startDate,
					endDate: campaigns.endDate,
					status: campaigns.status,
					targetCreatorCount: campaigns.targetCreatorCount,
					createdAt: campaigns.createdAt,
					updatedAt: campaigns.updatedAt,
					totalAssigned: sql<number>`count(${campaignCreators.id})::int`,
					...pipelineStatColumns(),
				})
				.from(campaigns)
				.leftJoin(campaignCreators, eq(campaignCreators.campaignId, campaigns.id))
				.groupBy(campaigns.id)
				.where(eq(campaigns.id, id));

			if (!campaign) {
				return reply.code(404).send({
					statusCode: 404,
					error: "Not Found",
					message: `Campaign ${id} not found`,
				});
			}

			// Assignments with creator info + score
			const assignments = await db
				.select({
					id: campaignCreators.id,
					creatorId: campaignCreators.creatorId,
					instagramHandle: creators.instagramHandle,
					fullName: creators.fullName,
					followersCount: creators.followersCount,
					creatorTier: creators.creatorTier,
					assignmentStatus: campaignCreators.assignmentStatus,
					postUrl: campaignCreators.postUrl,
					notes: campaignCreators.notes,
					statusUpdatedAt: campaignCreators.statusUpdatedAt,
					assignedAt: campaignCreators.assignedAt,
					confirmedAt: campaignCreators.confirmedAt,
					publishedAt: campaignCreators.publishedAt,
					verifiedAt: campaignCreators.verifiedAt,
					paidAt: campaignCreators.paidAt,
					impressions: campaignCreators.impressions,
					reach: campaignCreators.reach,
					saves: campaignCreators.saves,
					likes: campaignCreators.likes,
					comments: campaignCreators.comments,
					metricsEnteredBy: campaignCreators.metricsEnteredBy,
					metricsEnteredAt: campaignCreators.metricsEnteredAt,
					score: creatorScores.score,
				})
				.from(campaignCreators)
				.innerJoin(creators, eq(creators.id, campaignCreators.creatorId))
				.leftJoin(creatorScores, eq(creatorScores.creatorId, campaignCreators.creatorId))
				.where(eq(campaignCreators.campaignId, id))
				.orderBy(campaignCreators.assignedAt);

			return reply.send({ ...campaign, assignments });
		},
	);

	// ─── M1-08  POST /campaigns ──────────────────────────────────────────────
	app.post(
		"/campaigns",
		{
			schema: {
				tags: ["campaigns"],
				summary: "Create a new campaign",
				body: { type: "object" },
			},
		},
		async (request, reply) => {
			const parsed = CreateCampaignSchema.safeParse(request.body);
			if (!parsed.success) return zodError(reply, parsed.error);

			const data = parsed.data;
			const actor = performedBy(request);

			const [campaign] = await db.transaction(async (tx) => {
				const inserted = await tx
					.insert(campaigns)
					.values({
						...data,
						startDate: data.startDate ? new Date(data.startDate) : undefined,
						endDate: data.endDate ? new Date(data.endDate) : undefined,
					})
					.returning();

				if (!inserted[0]) throw new Error("Insert returned no rows");

				await tx.insert(auditLog).values({
					entityType: "campaign",
					entityId: inserted[0].id,
					action: "created",
					performedBy: actor,
				});

				return inserted;
			});

			return reply.code(201).send(campaign);
		},
	);

	// ─── M1-09  PUT /campaigns/:id ───────────────────────────────────────────
	app.put(
		"/campaigns/:id",
		{
			schema: {
				tags: ["campaigns"],
				summary: "Update a campaign (blocked when status = closed)",
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

			const parsed = UpdateCampaignSchema.safeParse(request.body);
			if (!parsed.success) return zodError(reply, parsed.error);

			const updates = parsed.data;
			const actor = performedBy(request);

			const [current] = await db
				.select({ id: campaigns.id, status: campaigns.status })
				.from(campaigns)
				.where(eq(campaigns.id, id));

			if (!current) {
				return reply.code(404).send({
					statusCode: 404,
					error: "Not Found",
					message: `Campaign ${id} not found`,
				});
			}

			if (current.status === "closed") {
				return reply.code(409).send({
					statusCode: 409,
					error: "Conflict",
					message: "Cannot edit a closed campaign",
				});
			}

			const [updated] = await db.transaction(async (tx) => {
				const result = await tx
					.update(campaigns)
					.set({
						...updates,
						startDate: updates.startDate ? new Date(updates.startDate) : undefined,
						endDate: updates.endDate ? new Date(updates.endDate) : undefined,
						updatedAt: new Date(),
					})
					.where(eq(campaigns.id, id))
					.returning();

				await tx.insert(auditLog).values({
					entityType: "campaign",
					entityId: id,
					action: "updated",
					performedBy: actor,
				});

				return result;
			});

			return reply.send(updated);
		},
	);

	// ─── M1-10  POST /campaigns/:id/creators ────────────────────────────────
	app.post(
		"/campaigns/:id/creators",
		{
			schema: {
				tags: ["campaigns"],
				summary: "Bulk-assign creators to a campaign (duplicates ignored)",
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

			const parsed = BulkAssignSchema.safeParse(request.body);
			if (!parsed.success) return zodError(reply, parsed.error);

			const { creatorIds } = parsed.data;

			// Campaign must exist
			const [campaign] = await db
				.select({ id: campaigns.id })
				.from(campaigns)
				.where(eq(campaigns.id, id));

			if (!campaign) {
				return reply.code(404).send({
					statusCode: 404,
					error: "Not Found",
					message: `Campaign ${id} not found`,
				});
			}

			// Verify all supplied creator IDs exist
			const existingCreators = await db
				.select({ id: creators.id })
				.from(creators)
				.where(inArray(creators.id, creatorIds));

			const foundIds = new Set(existingCreators.map((c) => c.id));
			const missing = creatorIds.filter((cid) => !foundIds.has(cid));
			if (missing.length > 0) {
				return reply.code(422).send({
					statusCode: 422,
					error: "Unprocessable Entity",
					message: `Creator IDs not found: ${missing.join(", ")}`,
				});
			}

			// Upsert — on conflict (campaign_id, creator_id) do nothing
			const rows = creatorIds.map((creatorId) => ({
				campaignId: id,
				creatorId,
			}));

			await db
				.insert(campaignCreators)
				.values(rows)
				.onConflictDoNothing({ target: [campaignCreators.campaignId, campaignCreators.creatorId] });

			// Return updated pipeline stats
			const [stats] = await db
				.select({
					totalAssigned: sql<number>`count(${campaignCreators.id})::int`,
					...pipelineStatColumns(),
				})
				.from(campaignCreators)
				.where(eq(campaignCreators.campaignId, id));

			return reply.code(201).send({
				assigned: creatorIds.length,
				...stats,
			});
		},
	);
}
