import { and, eq, desc } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../../db/index.js";
import { auditLog } from "../../db/schema/audit-log.js";

const PaginationSchema = z.object({
	page:  z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(25),
});

async function queryAuditLog(
	entityType: "creator" | "campaign" | "campaign_creator",
	entityId: string,
	page: number,
	limit: number,
) {
	const where = and(
		eq(auditLog.entityType, entityType),
		eq(auditLog.entityId, entityId),
	);

	const rows = await db
		.select()
		.from(auditLog)
		.where(where)
		.orderBy(desc(auditLog.performedAt))
		.limit(limit)
		.offset((page - 1) * limit);

	return rows;
}

export default async function auditRoute(app: FastifyInstance) {
	// ─── M1-18  GET /creators/:id/audit ─────────────────────────────────────
	app.get(
		"/creators/:id/audit",
		{
			schema: {
				tags: ["audit"],
				summary: "Paginated audit history for a creator",
				params: {
					type: "object",
					required: ["id"],
					properties: { id: { type: "string", format: "uuid" } },
				},
				querystring: {
					type: "object",
					properties: {
						page:  { type: "integer", minimum: 1, default: 1 },
						limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
					},
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const parsed = PaginationSchema.safeParse(request.query);
			if (!parsed.success) {
				return reply.code(400).send({
					statusCode: 400,
					error: "Bad Request",
					message: parsed.error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join("; "),
				});
			}
			const { page, limit } = parsed.data;
			const rows = await queryAuditLog("creator", id, page, limit);
			return reply.send({ data: rows, page, limit });
		},
	);

	// ─── M1-19  GET /campaigns/:id/audit ────────────────────────────────────
	app.get(
		"/campaigns/:id/audit",
		{
			schema: {
				tags: ["audit"],
				summary: "Paginated audit history for a campaign and its assignments",
				params: {
					type: "object",
					required: ["id"],
					properties: { id: { type: "string", format: "uuid" } },
				},
				querystring: {
					type: "object",
					properties: {
						page:  { type: "integer", minimum: 1, default: 1 },
						limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
					},
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const parsed = PaginationSchema.safeParse(request.query);
			if (!parsed.success) {
				return reply.code(400).send({
					statusCode: 400,
					error: "Bad Request",
					message: parsed.error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join("; "),
				});
			}
			const { page, limit } = parsed.data;
			const rows = await queryAuditLog("campaign", id, page, limit);
			return reply.send({ data: rows, page, limit });
		},
	);
}
