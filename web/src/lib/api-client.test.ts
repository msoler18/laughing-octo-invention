import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ApiError, apiClient } from "./api-client";

const BASE = "http://localhost:3001";

const server = setupServer(
	http.get(`${BASE}/api/v1/ok`, () => HttpResponse.json({ data: "hello" })),
	http.get(`${BASE}/api/v1/not-found`, () =>
		HttpResponse.json({ message: "Resource not found" }, { status: 404 })
	),
	http.get(`${BASE}/api/v1/no-content`, () => new HttpResponse(null, { status: 204 })),
	http.get(`${BASE}/api/v1/bad-json`, () => new HttpResponse("not json", { status: 500 }))
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("apiClient", () => {
	it("returns parsed JSON on success", async () => {
		const result = await apiClient.get<{ data: string }>("/api/v1/ok");
		expect(result.data).toBe("hello");
	});

	it("throws ApiError with status and message on HTTP error", async () => {
		await expect(apiClient.get("/api/v1/not-found")).rejects.toMatchObject({
			name: "ApiError",
			status: 404,
			message: "Resource not found",
		});
	});

	it("returns undefined for 204 No Content", async () => {
		const result = await apiClient.get("/api/v1/no-content");
		expect(result).toBeUndefined();
	});

	it("falls back to statusText when error body is not JSON", async () => {
		await expect(apiClient.get("/api/v1/bad-json")).rejects.toMatchObject({
			name: "ApiError",
			status: 500,
		});
	});

	it("throws ApiError(0) with a readable message when network fails", async () => {
		// Bypass MSW and make the underlying fetch throw a TypeError directly
		const fetchSpy = vi
			.spyOn(globalThis, "fetch")
			.mockRejectedValueOnce(new TypeError("Failed to fetch"));
		const err: unknown = await apiClient.get("/api/v1/ok").catch((e) => e);
		fetchSpy.mockRestore();
		expect(err).toBeInstanceOf(ApiError);
		const apiErr = err as ApiError;
		expect(apiErr.status).toBe(0);
		expect(apiErr.message).toMatch(/Sin conexión/);
	});
});
