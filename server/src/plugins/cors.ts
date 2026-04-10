import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

async function corsPlugin(app: FastifyInstance) {
	await app.register(cors, {
		origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
	});
}

export default fp(corsPlugin, { name: "cors" });
