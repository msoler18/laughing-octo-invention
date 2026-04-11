"use server";

import { redirect } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function callApi(path: string, method: string, body: unknown) {
	const res = await fetch(`${API}${path}`, {
		method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		return {
			ok: false as const,
			message: (data as { message?: string }).message ?? `Error ${res.status}`,
		};
	}

	return { ok: true as const, data: await res.json() };
}

export async function createCreator(_prev: unknown, formData: FormData) {
	const raw = Object.fromEntries(formData.entries());
	const body = parseFormBody(raw);

	const result = await callApi("/api/v1/creators", "POST", body);
	if (!result.ok) return { error: result.message };

	redirect("/creators?toast=created");
}

export async function updateCreator(id: string, _prev: unknown, formData: FormData) {
	const raw = Object.fromEntries(formData.entries());
	const body = parseFormBody(raw);

	const result = await callApi(`/api/v1/creators/${id}`, "PUT", body);
	if (!result.ok) return { error: result.message };

	redirect("/creators?toast=updated");
}

// ── Coerce FormData strings to the types the API expects ─────────────────────

function parseFormBody(raw: Record<string, FormDataEntryValue>) {
	const str = (k: string) => (raw[k] as string | undefined)?.trim() || undefined;
	const num = (k: string) => {
		const v = str(k);
		return v !== undefined ? Number(v) : undefined;
	};
	const arr = (k: string) =>
		str(k)
			?.split(",")
			.map((s) => s.trim())
			.filter(Boolean);

	return {
		instagramHandle: str("instagramHandle"),
		fullName: str("fullName"),
		phone: str("phone"),
		email: str("email"),
		country: str("country"),
		city: str("city"),
		followersCount: num("followersCount"),
		engagementRate: num("engagementRate"),
		avgLikesLast10: num("avgLikesLast10"),
		reachRate: num("reachRate"),
		creatorTier: str("creatorTier"),
		engagementQuality: str("engagementQuality"),
		consistencyScore: num("consistencyScore"),
		audienceQualityScore: num("audienceQualityScore"),
		bioText: str("bioText"),
		contentLanguage: str("contentLanguage"),
		dominantFormat: str("dominantFormat"),
		tiktokHandle: str("tiktokHandle"),
		brandMentionsLast30Posts: num("brandMentionsLast30Posts"),
		bioKeywords: arr("bioKeywords"),
		contentRateUsd: num("contentRateUsd"),
		paymentMethod: str("paymentMethod"),
		onboardingStatus: str("onboardingStatus"),
		campaignsParticipated: num("campaignsParticipated"),
		notes: str("notes"),
		tags: arr("tags"),
	};
}
