import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ASSIGNMENT_STATUSES, type CampaignRow } from "./types";

const STATUS_COLORS: Record<string, string> = {
	prospecto:         "bg-status-prospecto",
	contactado:        "bg-status-contactado",
	confirmado:        "bg-status-confirmado",
	en_brief:          "bg-status-en-brief",
	contenido_enviado: "bg-status-contenido-enviado",
	aprobado:          "bg-status-aprobado",
	publicado:         "bg-status-publicado",
	verificado:        "bg-status-verificado",
	pagado:            "bg-status-pagado",
};

const CAMPAIGN_STATUS_VARIANT: Record<string, "default" | "primary" | "ai"> = {
	draft:  "default",
	active: "primary",
	closed: "ai",
};

function PipelineBar({ campaign }: { campaign: CampaignRow }) {
	const total = campaign.totalAssigned;
	if (total === 0) return <div className="h-1.5 rounded-full bg-bg-elevated" />;

	return (
		<div className="flex h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
			{ASSIGNMENT_STATUSES.map((status) => {
				const count = campaign[status] as number;
				if (count === 0) return null;
				const pct = (count / total) * 100;
				return (
					<div
						key={status}
						title={`${status}: ${count}`}
						className={cn("h-full transition-all", STATUS_COLORS[status])}
						style={{ width: `${pct}%` }}
					/>
				);
			})}
		</div>
	);
}

export function CampaignCard({ campaign }: { campaign: CampaignRow }) {
	const start = campaign.startDate
		? new Date(campaign.startDate).toLocaleDateString("es-CO", { day: "numeric", month: "short" })
		: null;
	const end = campaign.endDate
		? new Date(campaign.endDate).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
		: null;

	return (
		<Link
			href={`/campaigns/${campaign.id}`}
			className="block rounded-xl bg-bg-surface ring-1 ring-border-default p-5 hover:ring-blue-400/40 hover:bg-bg-elevated transition-all"
		>
			<div className="flex items-start justify-between gap-3 mb-3">
				<div className="min-w-0">
					<p className="font-semibold text-text-primary truncate">{campaign.name}</p>
					<p className="text-xs text-text-tertiary truncate">{campaign.brand}</p>
				</div>
				<Badge variant={CAMPAIGN_STATUS_VARIANT[campaign.status]}>
					{campaign.status}
				</Badge>
			</div>

			{/* Pipeline progress bar */}
			<PipelineBar campaign={campaign} />

			{/* Counters row */}
			<div className="mt-3 flex items-center justify-between text-xs text-text-tertiary">
				<span>
					<span className="font-mono font-medium text-text-secondary">{campaign.totalAssigned}</span>
					{" / "}
					<span>{campaign.targetCreatorCount || "∞"} creadores</span>
				</span>
				{start && end && <span>{start} → {end}</span>}
			</div>

			{/* Key status highlights */}
			<div className="mt-3 flex flex-wrap gap-1.5">
				{(["publicado", "verificado", "pagado"] as const).map((s) => {
					const count = campaign[s] as number;
					if (count === 0) return null;
					return (
						<span key={s} className="text-xs text-text-tertiary">
							<span className="font-mono font-medium text-text-secondary">{count}</span>{" "}
							{s}
						</span>
					);
				})}
			</div>
		</Link>
	);
}
