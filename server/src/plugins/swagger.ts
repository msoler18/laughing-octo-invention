import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

async function swaggerPlugin(app: FastifyInstance) {
	await app.register(swagger, {
		openapi: {
			openapi: "3.0.0",
			info: {
				title: "RealUp API",
				description: "Internal API for the RealUp Crowdposting Campaign Manager",
				version: "1.0.0",
			},
			servers: [{ url: "/api/v1", description: "Current version" }],
			tags: [
				{ name: "health", description: "Health check" },
				{ name: "creators", description: "Creator management" },
				{ name: "campaigns", description: "Campaign management" },
				{ name: "search", description: "RAG semantic search" },
				{ name: "chat", description: "Conversational AI assistant" },
				{ name: "import", description: "CSV import jobs" },
			],
		},
	});

	await app.register(swaggerUi, {
		routePrefix: "/docs",
		uiConfig: {
			docExpansion: "list",
			deepLinking: true,
		},
	});
}

export default fp(swaggerPlugin, { name: "swagger" });
