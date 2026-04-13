/** Typed fetch wrapper for the Fastify API server. */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string
	) {
		super(message);
		this.name = "ApiError";
	}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	let res: Response;
	try {
		res = await fetch(`${BASE}${path}`, {
			headers: { "Content-Type": "application/json", ...init?.headers },
			...init,
		});
	} catch {
		// Network failure (server down, DNS error, CORS preflight blocked, etc.)
		throw new ApiError(0, "Sin conexión con el servidor. Verifica que el backend esté corriendo.");
	}

	if (!res.ok) {
		const body = await res.json().catch(() => ({ message: res.statusText }));
		throw new ApiError(res.status, body.message ?? res.statusText);
	}

	// 204 No Content — return undefined cast to T
	if (res.status === 204) return undefined as T;

	return res.json() as Promise<T>;
}

export const apiClient = {
	get: <T>(path: string, init?: RequestInit) => request<T>(path, { method: "GET", ...init }),
	post: <T>(path: string, body: unknown, init?: RequestInit) =>
		request<T>(path, { method: "POST", body: JSON.stringify(body), ...init }),
	put: <T>(path: string, body: unknown, init?: RequestInit) =>
		request<T>(path, { method: "PUT", body: JSON.stringify(body), ...init }),
	patch: <T>(path: string, body: unknown, init?: RequestInit) =>
		request<T>(path, { method: "PATCH", body: JSON.stringify(body), ...init }),
	delete: <T>(path: string, init?: RequestInit) => request<T>(path, { method: "DELETE", ...init }),
};
