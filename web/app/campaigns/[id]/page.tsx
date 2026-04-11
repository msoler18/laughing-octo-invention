"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, Calendar, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { PipelineStatsBar } from "@/features/campaigns/pipeline-stats";
import { AssignmentsTable } from "@/features/campaigns/assignments-table";
import { AssignmentsKanban } from "@/features/campaigns/assignments-kanban";
import { useCampaign } from "@/features/campaigns/use-campaign";
import { useCampaignRealtime } from "@/features/campaigns/use-campaign-realtime";
import type { CampaignStatus } from "@/features/campaigns/types";

const CAMPAIGN_STATUS_VARIANT: Record<CampaignStatus, "default" | "primary" | "ai"> = {
	draft:  "default",
	active: "primary",
	closed: "ai",
};

function fmt(dateStr: string | null) {
	if (!dateStr) return null;
	return new Date(dateStr).toLocaleDateString("es-CO", {
		day: "numeric", month: "short", year: "numeric",
	});
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PageSkeleton() {
	return (
		<>
			<div className="h-14 border-b border-border-default bg-bg-page" />
			<div className="p-6 space-y-6">
				<div className="h-20 rounded-xl bg-bg-surface animate-pulse" />
				<div className="h-8 w-64 rounded bg-bg-elevated animate-pulse" />
				<div className="h-64 rounded-lg bg-bg-surface animate-pulse" />
			</div>
		</>
	);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CampaignDetailPage() {
	const { id } = useParams<{ id: string }>();
	const searchParams = useSearchParams();
	const router = useRouter();

	// M2-22 — view toggle via URL param
	const view = (searchParams.get("view") ?? "table") as "table" | "kanban";

	function setView(v: "table" | "kanban") {
		const params = new URLSearchParams(searchParams.toString());
		params.set("view", v);
		router.replace(`/campaigns/${id}?${params.toString()}`);
	}

	// M2-18 — TanStack Query
	const { data: campaign, isLoading, isError } = useCampaign(id);

	// M2-23 — Supabase Realtime
	useCampaignRealtime(id);

	if (isLoading) return <PageSkeleton />;

	if (isError || !campaign) {
		return (
			<div className="flex flex-col items-center justify-center h-full py-24 text-center">
				<p className="text-sm font-medium text-text-primary">Campaña no encontrada</p>
				<Button variant="ghost" size="sm" className="mt-3" onClick={() => router.push("/campaigns")}>
					Volver a campañas
				</Button>
			</div>
		);
	}

	const startFmt = fmt(campaign.startDate);
	const endFmt   = fmt(campaign.endDate);

	return (
		<>
			{/* M2-19 — Campaign header */}
			<Topbar
				title={campaign.name}
				description={campaign.brand}
				actions={
					<div className="flex items-center gap-2">
						<Badge variant={CAMPAIGN_STATUS_VARIANT[campaign.status]}>
							{campaign.status}
						</Badge>
						{startFmt && endFmt && (
							<span className="flex items-center gap-1 text-xs text-text-tertiary">
								<Calendar size={12} />
								{startFmt} → {endFmt}
							</span>
						)}
					</div>
				}
			/>

			<div className="p-6 space-y-6">
				{/* Pipeline stats bar */}
				<div className="rounded-xl bg-bg-surface ring-1 ring-border-default p-5">
					<PipelineStatsBar stats={campaign} />
				</div>

				{/* M2-22 — Table / Kanban toggle */}
				<div className="flex items-center justify-between">
					<p className="text-sm font-medium text-text-primary">
						{campaign.totalAssigned} creadores asignados
					</p>
					<div className="flex items-center gap-1 rounded-lg bg-bg-surface ring-1 ring-border-default p-1">
						<Button
							variant={view === "table" ? "primary" : "ghost"}
							size="sm"
							onClick={() => setView("table")}
						>
							<List size={14} />
							Tabla
						</Button>
						<Button
							variant={view === "kanban" ? "primary" : "ghost"}
							size="sm"
							onClick={() => setView("kanban")}
						>
							<LayoutGrid size={14} />
							Kanban
						</Button>
					</div>
				</div>

				{/* M2-20 / M2-21 — Assignments view */}
				{view === "table" ? (
					<AssignmentsTable
						assignments={campaign.assignments}
						campaignId={campaign.id}
					/>
				) : (
					<AssignmentsKanban
						assignments={campaign.assignments}
						campaignId={campaign.id}
					/>
				)}
			</div>
		</>
	);
}
