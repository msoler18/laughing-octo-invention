import fastify from "fastify";
import corsPlugin from "./plugins/cors.js";
import cronPlugin from "./plugins/cron.js";
import swaggerPlugin from "./plugins/swagger.js";
import healthRoute from "./routes/v1/health.js";
import creatorsRoute from "./routes/v1/creators/index.js";
import campaignsRoute from "./routes/v1/campaigns/index.js";
import campaignLifecycleRoute from "./routes/v1/campaigns/lifecycle.js";

export async function buildApp() {
	const app = fastify({
		logger: {
			level: process.env.LOG_LEVEL ?? "info",
		},
	});

	// Plugins
	await app.register(corsPlugin);
	await app.register(swaggerPlugin);
	await app.register(cronPlugin);

	// Routes — versioned under /api/v1
	await app.register(healthRoute, { prefix: "/api/v1" });
	await app.register(creatorsRoute, { prefix: "/api/v1" });
	await app.register(campaignsRoute, { prefix: "/api/v1" });
	await app.register(campaignLifecycleRoute, { prefix: "/api/v1" });

	return app;
}
