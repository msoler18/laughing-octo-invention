import fastify from "fastify";
import corsPlugin from "./plugins/cors.js";
import swaggerPlugin from "./plugins/swagger.js";
import healthRoute from "./routes/v1/health.js";

export async function buildApp() {
	const app = fastify({
		logger: {
			level: process.env.LOG_LEVEL ?? "info",
		},
	});

	// Plugins
	await app.register(corsPlugin);
	await app.register(swaggerPlugin);

	// Routes — versioned under /api/v1
	await app.register(healthRoute, { prefix: "/api/v1" });

	return app;
}
