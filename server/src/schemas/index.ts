// Shared JSON Schema definitions reused across routes.
// Each feature adds its own schemas here or in a co-located file.
// Imported by route handlers to avoid duplication with @fastify/swagger.

export const PaginationQuerySchema = {
	type: "object",
	properties: {
		page: { type: "integer", minimum: 1, default: 1 },
		limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
	},
} as const;

export const ErrorResponseSchema = {
	type: "object",
	properties: {
		statusCode: { type: "integer" },
		error: { type: "string" },
		message: { type: "string" },
	},
	required: ["statusCode", "error", "message"],
} as const;
