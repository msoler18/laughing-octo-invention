import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { CampaignCard } from "@/features/campaigns/campaign-card";
import { NewCampaignButton } from "@/features/campaigns/new-campaign-dialog";
import { createCampaign } from "./actions";
import type { CampaignRow } from "@/features/campaigns/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function CampaignsList() {
	const res = await fetch(`${API}/api/v1/campaigns`, { cache: "no-store" });
	if (!res.ok) throw new Error("No se pudieron cargar las campañas");

	const { data } = await res.json() as { data: CampaignRow[] };

	if (data.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-24 text-center">
				<p className="text-sm font-medium text-text-primary">Sin campañas todavía</p>
				<p className="mt-1 text-xs text-text-tertiary">
					Crea tu primera campaña con el botón "Nueva campaña".
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{data.map((c) => (
				<CampaignCard key={c.id} campaign={c} />
			))}
		</div>
	);
}

function CampaignsSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className="h-40 rounded-xl bg-bg-surface ring-1 ring-border-default animate-pulse" />
			))}
		</div>
	);
}

export default function CampaignsPage() {
	return (
		<>
			<Topbar
				title="Campañas"
				description="Gestión de campañas de Crowdposting"
				actions={<NewCampaignButton createAction={createCampaign} />}
			/>
			<div className="p-6">
				{/* M2-15: Streaming with Suspense */}
				<Suspense fallback={<CampaignsSkeleton />}>
					<CampaignsList />
				</Suspense>
			</div>
		</>
	);
}
