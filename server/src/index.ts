import { buildApp } from "./app.js";

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST ?? "0.0.0.0";

const app = await buildApp();

try {
	await app.listen({ port: PORT, host: HOST });
	console.log(`Server listening on http://${HOST}:${PORT}`);
	console.log(`API docs: http://${HOST}:${PORT}/docs`);
} catch (err) {
	app.log.error(err);
	process.exit(1);
}

// ── M7-19  Graceful shutdown ──────────────────────────────────────────────────
// Fastify.close() drains in-flight requests and closes DB connections cleanly.
// Without this, container orchestrators (Docker, k8s) get a SIGTERM → SIGKILL
// race and may cut connections mid-request.

async function shutdown(signal: string) {
	app.log.info(`Received ${signal}, shutting down gracefully…`);
	try {
		await app.close();
		app.log.info("Server closed cleanly");
		process.exit(0);
	} catch (err) {
		app.log.error({ err }, "Error during shutdown");
		process.exit(1);
	}
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
