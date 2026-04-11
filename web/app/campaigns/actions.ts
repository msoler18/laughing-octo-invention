"use server";

import { redirect } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function createCampaign(_prev: unknown, formData: FormData) {
	const str = (k: string) => (formData.get(k) as string | null)?.trim() || undefined;
	const num = (k: string) => {
		const v = str(k);
		return v ? Number(v) : undefined;
	};

	// Convert date input (YYYY-MM-DD) to ISO datetime
	const toISO = (k: string) => {
		const v = str(k);
		return v ? new Date(v).toISOString() : undefined;
	};

	const body = {
		name: str("name"),
		brand: str("brand"),
		description: str("description"),
		briefText: str("briefText"),
		startDate: toISO("startDate"),
		endDate: toISO("endDate"),
		targetCreatorCount: num("targetCreatorCount") ?? 0,
	};

	const res = await fetch(`${API}/api/v1/campaigns`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		return { error: (data as { message?: string }).message ?? `Error ${res.status}` };
	}

	const campaign = (await res.json()) as { id: string };
	redirect(`/campaigns/${campaign.id}`);
}
