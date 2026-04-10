import type { FastifyInstance } from "fastify";

export default async function healthRoute(app: FastifyInstance) {
	app.get(
		"/health",
		{
			schema: {
				tags: ["health"],
				summary: "Health check",
				response: {
					200: {
						type: "object",
						properties: {
							status: { type: "string", enum: ["ok"] },
							version: { type: "string" },
							timestamp: { type: "string", format: "date-time" },
						},
						required: ["status", "version", "timestamp"],
					},
				},
			},
		},
		async () => ({
			status: "ok" as const,
			version: "1.0.0",
			timestamp: new Date().toISOString(),
		}),
	);
}
