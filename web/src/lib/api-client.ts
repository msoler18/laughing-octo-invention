/** Typed fetch wrapper for the Fastify API server. */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE}${path}`, {
		headers: { "Content-Type": "application/json", ...init?.headers },
		...init,
	});

	if (!res.ok) {
		const body = await res.json().catch(() => ({ message: res.statusText }));
		throw new ApiError(res.status, body.message ?? res.statusText);
	}

	// 204 No Content — return undefined cast to T
	if (res.status === 204) return undefined as T;

	return res.json() as Promise<T>;
}

export const apiClient = {
	get:    <T>(path: string, init?: RequestInit) => request<T>(path, { method: "GET", ...init }),
	post:   <T>(path: string, body: unknown, init?: RequestInit) =>
		request<T>(path, { method: "POST", body: JSON.stringify(body), ...init }),
	put:    <T>(path: string, body: unknown, init?: RequestInit) =>
		request<T>(path, { method: "PUT", body: JSON.stringify(body), ...init }),
	patch:  <T>(path: string, body: unknown, init?: RequestInit) =>
		request<T>(path, { method: "PATCH", body: JSON.stringify(body), ...init }),
	delete: <T>(path: string, init?: RequestInit) => request<T>(path, { method: "DELETE", ...init }),
};
