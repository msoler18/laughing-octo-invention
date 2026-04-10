import { eq, sql } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z, type ZodError } from "zod";
import { db } from "../../../db/index.js";
import { auditLog } from "../../../db/schema/audit-log.js";
import { campaignCreators } from "../../../db/schema/campaign-creators.js";
import { campaigns } from "../../../db/schema/campaigns.js";
import { creatorScores } from "../../../db/schema/creator-scores.js";
import { creators } from "../../../db/schema/creators.js";
import { ASSIGNMENT_STATUSES } from "../../../schemas/campaigns.js";

// ── Types ─────────────────────────────────────────────────────────────────────

type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

// ── State machine ─────────────────────────────────────────────────────────────
// Each key lists which statuses it may transition TO.
// No entry = terminal state (pagado).

const VALID_TRANSITIONS: Record<AssignmentStatus, AssignmentStatus[]> = {
	prospecto:         ["contactado"],
	contactado:        ["confirmado", "prospecto"],
	confirmado:        ["en_brief", "contactado"],
	en_brief:          ["contenido_enviado", "confirmado"],
	contenido_enviado: ["aprobado", "en_brief"],
	aprobado:          ["publicado", "contenido_enviado"],
	publicado:         ["verificado"],
	verificado:        ["pagado", "publicado"],
	pagado:            [],
};

// Timestamps to stamp when entering a status
const STATUS_TIMESTAMP: Partial<Record<AssignmentStatus, keyof typeof campaignCreators.$inferSelect>> = {
	confirmado: "confirmedAt",
	publicado:  "publishedAt",
	verificado: "verifiedAt",
	pagado:     "paidAt",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function pipelineStatColumns() {
	return Object.fromEntries(
		ASSIGNMENT_STATUSES.map((status) => [
			status,
			sql<number>`count(${campaignCreators.id}) FILTER (WHERE ${campaignCreators.assignmentStatus} = ${status})::int`,
		]),
	) as Record<string, ReturnType<typeof sql<number>>>;
}

async function fetchAssignment(campaignId: string, creatorId: string) {
	const [row] = await db
		.select()
		.from(campaignCreators)
		.where(
			eq(campaignCreators.campaignId, campaignId) &&
			eq(campaignCreators.creatorId, creatorId),
		);
	return row;
}

async function getPipelineStats(campaignId: string) {
	const [stats] = await db
		.select({
			totalAssigned: sql<number>`count(${campaignCreators.id})::int`,
			...pipelineStatColumns(),
		})
		.from(campaignCreators)
		.where(eq(campaignCreators.campaignId, campaignId));
	return stats;
}

// ── Plugin ────────────────────────────────────────────────────────────────────

export default async function campaignLifecycleRoute(app: FastifyInstance) {
	// ─── M1-11  PATCH /campaigns/:id/creators/:creatorId/status ─────────────
	app.patch(
		"/campaigns/:id/creators/:creatorId/status",
		{
			schema: {
				tags: ["campaigns"],
				summary: "Transition a creator's assignment status",
				params: {
					type: "object",
					required: ["id", "creatorId"],
					properties: {
						id:        { type: "string", format: "uuid" },
						creatorId: { type: "string", format: "uuid" },
					},
				},
				body: {
					type: "object",
					required: ["status"],
					properties: {
						status: { type: "string", enum: ASSIGNMENT_STATUSES as unknown as string[] },
					},
				},
			},
		},
		async (request, reply) => {
			const { id, creatorId } = request.params as { id: string; creatorId: string };
			const parsed = z
				.object({ status: z.enum(ASSIGNMENT_STATUSES) })
				.safeParse(request.body);
			if (!parsed.success) return zodError(reply, parsed.error);

			const newStatus = parsed.data.status;
			const actor = performedBy(request);

			const assignment = await fetchAssignment(id, creatorId);
			if (!assignment) {
				return reply.code(404).send({
					statusCode: 404,
					error: "Not Found",
					message: `Assignment not found for campaign ${id} / creator ${creatorId}`,
				});
			}

			const currentStatus = assignment.assignmentStatus as AssignmentStatus;

			// Validate transition
			if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
				return reply.code(422).send({
					statusCode: 422,
					error: "Unprocessable Entity",
					message: `Invalid transition: ${currentStatus} → ${newStatus}. Allowed: ${VALID_TRANSITIONS[currentStatus]?.join(", ") || "none"}`,
				});
			}

			// Guard: publicado requires post_url
			if (newStatus === "publicado" && !assignment.postUrl) {
				return reply.code(422).send({
					statusCode: 422,
					error: "Unprocessable Entity",
					message: "Cannot move to publicado without a registered post_url",
				});
			}

			// Build status-specific timestamp update
			const timestampField = STATUS_TIMESTAMP[newStatus];
			const timestampUpdate = timestampField ? { [timestampField]: new Date() } : {};

			await db.transaction(async (tx) => {
				await tx
					.update(campaignCreators)
					.set({
						assignmentStatus: newStatus,
						statusUpdatedAt: new Date(),
						...timestampUpdate,
					})
					.where(
						eq(campaignCreators.campaignId, id) &&
						eq(campaignCreators.creatorId, creatorId),
					);

				await tx.insert(auditLog).values({
					entityType: "campaign_creator",
					entityId: assignment.id,
					action: "status_changed",
					fieldName: "assignment_status",
					oldValue: currentStatus,
					newValue: newStatus,
					performedBy: actor,
				});
			});

			const stats = await getPipelineStats(id);
			return reply.send({ status: newStatus, pipeline: stats });
		},
	);

	// ─── M1-12  PATCH /campaigns/:id/creators/:creatorId/post-url ───────────
	app.patch(
		"/campaigns/:id/creators/:creatorId/post-url",
		{
			schema: {
				tags: ["campaigns"],
				summary: "Register the Instagram post URL for an assignment",
				params: {
					type: "object",
					required: ["id", "creatorId"],
					properties: {
						id:        { type: "string", format: "uuid" },
						creatorId: { type: "string", format: "uuid" },
					},
				},
				body: {
					type: "object",
					required: ["postUrl"],
					properties: { postUrl: { type: "string", format: "uri" } },
				},
			},
		},
		async (request, reply) => {
			const { id, creatorId } = request.params as { id: string; creatorId: string };
			const parsed = z
				.object({ postUrl: z.string().url() })
				.safeParse(request.body);
			if (!parsed.success) return zodError(reply, parsed.error);

			const { postUrl } = parsed.data;
			const actor = performedBy(request);

			const assignment = await fetchAssignment(id, creatorId);
			if (!assignment) {
				return reply.code(404).send({
					statusCode: 404,
					error: "Not Found",
					message: `Assignment not found for campaign ${id} / creator ${creatorId}`,
				});
			}

			await db.transaction(async (tx) => {
				await tx
					.update(campaignCreators)
					.set({ postUrl, statusUpdatedAt: new Date() })
					.where(
						eq(campaignCreators.campaignId, id) &&
						eq(campaignCreators.creatorId, creatorId),
					);

				await tx.insert(auditLog).values({
					entityType: "campaign_creator",
					entityId: assignment.id,
					action: "updated",
					fieldName: "post_url",
					oldValue: assignment.postUrl ?? "",
					newValue: postUrl,
					performedBy: actor,
				});
			});

			return reply.send({ postUrl });
		},
	);

	// ─── M1-13  PATCH /campaigns/:id/creators/:creatorId/metrics ────────────
	app.patch(
		"/campaigns/:id/creators/:creatorId/metrics",
		{
			schema: {
				tags: ["campaigns"],
				summary: "Record post performance metrics for an assignment",
				params: {
					type: "object",
					required: ["id", "creatorId"],
					properties: {
						id:        { type: "string", format: "uuid" },
						creatorId: { type: "string", format: "uuid" },
					},
				},
				body: {
					type: "object",
					properties: {
						impressions: { type: "integer", minimum: 0 },
						reach:       { type: "integer", minimum: 0 },
						saves:       { type: "integer", minimum: 0 },
						likes:       { type: "integer", minimum: 0 },
						comments:    { type: "integer", minimum: 0 },
					},
				},
			},
		},
		async (request, reply) => {
			const { id, creatorId } = request.params as { id: string; creatorId: string };
			const parsed = z
				.object({
					impressions: z.number().int().min(0).optional(),
					reach:       z.number().int().min(0).optional(),
					saves:       z.number().int().min(0).optional(),
					likes:       z.number().int().min(0).optional(),
					comments:    z.number().int().min(0).optional(),
				})
				.safeParse(request.body);
			if (!parsed.success) return zodError(reply, parsed.error);

			const metrics = parsed.data;
			const actor = performedBy(request);

			const assignment = await fetchAssignment(id, creatorId);
			if (!assignment) {
				return reply.code(404).send({
					statusCode: 404,
					error: "Not Found",
					message: `Assignment not found for campaign ${id} / creator ${creatorId}`,
				});
			}

			const now = new Date();
			await db
				.update(campaignCreators)
				.set({
					...metrics,
					metricsEnteredBy: actor,
					metricsEnteredAt: now,
				})
				.where(
					eq(campaignCreators.campaignId, id) &&
					eq(campaignCreators.creatorId, creatorId),
				);

			return reply.send({ ...metrics, metricsEnteredBy: actor, metricsEnteredAt: now });
		},
	);

	// ─── M1-14  GET /campaigns/:id/export ───────────────────────────────────
	app.get(
		"/campaigns/:id/export",
		{
			schema: {
				tags: ["campaigns"],
				summary: "Export campaign assignments as CSV",
				params: {
					type: "object",
					required: ["id"],
					properties: { id: { type: "string", format: "uuid" } },
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };

			const [campaign] = await db
				.select({ id: campaigns.id, name: campaigns.name })
				.from(campaigns)
				.where(eq(campaigns.id, id));

			if (!campaign) {
				return reply.code(404).send({
					statusCode: 404,
					error: "Not Found",
					message: `Campaign ${id} not found`,
				});
			}

			const rows = await db
				.select({
					fullName:         creators.fullName,
					instagramHandle:  creators.instagramHandle,
					assignmentStatus: campaignCreators.assignmentStatus,
					postUrl:          campaignCreators.postUrl,
					impressions:      campaignCreators.impressions,
					reach:            campaignCreators.reach,
					saves:            campaignCreators.saves,
					likes:            campaignCreators.likes,
					comments:         campaignCreators.comments,
					metricsEnteredAt: campaignCreators.metricsEnteredAt,
					score:            creatorScores.score,
				})
				.from(campaignCreators)
				.innerJoin(creators, eq(creators.id, campaignCreators.creatorId))
				.leftJoin(creatorScores, eq(creatorScores.creatorId, campaignCreators.creatorId))
				.where(eq(campaignCreators.campaignId, id))
				.orderBy(campaignCreators.assignedAt);

			const headers = [
				"full_name",
				"instagram_handle",
				"status",
				"post_url",
				"impressions",
				"reach",
				"saves",
				"likes",
				"comments",
				"metrics_entered_at",
				"score",
			];

			const escape = (v: unknown): string => {
				if (v === null || v === undefined) return "";
				const s = String(v);
				// Wrap in quotes if value contains comma, quote or newline
				return s.includes(",") || s.includes('"') || s.includes("\n")
					? `"${s.replace(/"/g, '""')}"`
					: s;
			};

			const lines = [
				headers.join(","),
				...rows.map((r) =>
					[
						r.fullName,
						r.instagramHandle,
						r.assignmentStatus,
						r.postUrl,
						r.impressions,
						r.reach,
						r.saves,
						r.likes,
						r.comments,
						r.metricsEnteredAt?.toISOString(),
						r.score,
					]
						.map(escape)
						.join(","),
				),
			];

			const filename = `campaign-${campaign.name.replace(/\s+/g, "-").toLowerCase()}.csv`;

			reply.header("Content-Type", "text/csv; charset=utf-8");
			reply.header("Content-Disposition", `attachment; filename="${filename}"`);
			return reply.send(lines.join("\r\n"));
		},
	);
}
