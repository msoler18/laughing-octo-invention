import { HttpResponse, http } from "msw";

// Base URL for the Fastify API in tests
const API = "http://localhost:3001/api/v1";

// ─── Default handlers ────────────────────────────────────────────────────────
// Add feature-specific handlers here as routes are built (M1 onwards).
// Each handler can be overridden per-test using server.use(...).

export const handlers = [
	// Health check — used in smoke tests
	http.get(`${API}/health`, () =>
		HttpResponse.json({
			status: "ok",
			version: "1.0.0",
			timestamp: new Date().toISOString(),
		})
	),
];
