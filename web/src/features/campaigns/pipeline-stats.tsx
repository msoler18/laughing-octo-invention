import { Badge, statusVariant, STATUS_LABELS } from "@/components/ui/badge";
import { ASSIGNMENT_STATUSES, type PipelineStats } from "./types";

const STATUS_BAR_COLORS: Record<string, string> = {
	prospecto:         "bg-gray-500",
	contactado:        "bg-sky-400",
	confirmado:        "bg-violet-400",
	en_brief:          "bg-amber-400",
	contenido_enviado: "bg-orange-400",
	aprobado:          "bg-lime-400",
	publicado:         "bg-emerald-400",
	verificado:        "bg-cyan-400",
	pagado:            "bg-teal-400",
};

export function PipelineStatsBar({ stats }: { stats: PipelineStats }) {
	const total = stats.totalAssigned;

	return (
		<div className="space-y-3">
			{/* Stacked progress bar */}
			<div className="flex h-2 w-full overflow-hidden rounded-full bg-bg-elevated">
				{total > 0 &&
					ASSIGNMENT_STATUSES.map((status) => {
						const count = stats[status];
						if (count === 0) return null;
						return (
							<div
								key={status}
								className={`h-full transition-all ${STATUS_BAR_COLORS[status]}`}
								style={{ width: `${(count / total) * 100}%` }}
								title={`${STATUS_LABELS[status]}: ${count}`}
							/>
						);
					})}
			</div>

			{/* Per-status counters */}
			<div className="flex flex-wrap gap-2">
				{ASSIGNMENT_STATUSES.map((status) => {
					const count = stats[status];
					return (
						<div key={status} className="flex items-center gap-1.5">
							<Badge variant={statusVariant(status)}>
								{STATUS_LABELS[status]}
							</Badge>
							<span className="text-xs font-mono text-text-secondary">{count}</span>
						</div>
					);
				})}
				<div className="ml-auto flex items-center gap-1 text-xs text-text-tertiary">
					Total: <span className="font-mono font-medium text-text-secondary">{total}</span>
				</div>
			</div>
		</div>
	);
}
