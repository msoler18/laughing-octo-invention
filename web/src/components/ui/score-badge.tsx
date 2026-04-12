"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ── Letter grade ──────────────────────────────────────────────────────────────

export function scoreGrade(n: number): "A" | "B" | "C" | "D" {
	if (n >= 75) return "A";
	if (n >= 50) return "B";
	if (n >= 25) return "C";
	return "D";
}

function gradeColor(grade: "A" | "B" | "C" | "D"): string {
	return {
		A: "text-emerald-400",
		B: "text-amber-400",
		C: "text-orange-400",
		D: "text-red-400",
	}[grade];
}

// ── Score breakdown (weights from creator_scores) ─────────────────────────────

export interface ScoreBreakdown {
	engagementWeight: string | null; // 0–40
	tierWeight: string | null; // 0–30
	consistencyWeight: string | null; // 0–20
	campaignHistoryWeight: string | null; // 0–10
}

function BreakdownRow({ label, value, max }: { label: string; value: number; max: number }) {
	const pct = max > 0 ? (value / max) * 100 : 0;
	return (
		<div className="space-y-0.5">
			<div className="flex justify-between text-xs">
				<span className="text-text-secondary">{label}</span>
				<span className="font-mono text-text-primary">
					{value.toFixed(0)}
					<span className="text-text-tertiary">/{max}</span>
				</span>
			</div>
			<div className="h-1 rounded-full bg-bg-elevated overflow-hidden">
				<div className="h-full rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
			</div>
		</div>
	);
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ScoreBadgeProps {
	score: string | null;
	breakdown?: ScoreBreakdown;
	size?: "sm" | "md";
}

export function ScoreBadge({ score, breakdown, size = "sm" }: ScoreBadgeProps) {
	if (!score) {
		return <span className="font-mono text-text-tertiary">—</span>;
	}

	const n = parseFloat(score);
	const grade = scoreGrade(n);
	const color = gradeColor(grade);

	const badge = (
		<span
			className={cn(
				"inline-flex items-center gap-1 font-mono font-medium cursor-default",
				size === "md" ? "text-sm" : "text-xs",
				color
			)}
		>
			<span className="font-bold">{grade}</span>
			<span className="text-text-secondary">{n.toFixed(0)}</span>
		</span>
	);

	// No breakdown available → just show the badge
	if (!breakdown) return badge;

	const ew = parseFloat(breakdown.engagementWeight ?? "0");
	const tw = parseFloat(breakdown.tierWeight ?? "0");
	const cw = parseFloat(breakdown.consistencyWeight ?? "0");
	const hw = parseFloat(breakdown.campaignHistoryWeight ?? "0");

	return (
		<Tooltip>
			<TooltipTrigger asChild>{badge}</TooltipTrigger>
			<TooltipContent side="left" className="w-52 space-y-2 p-3">
				<p className="text-xs font-semibold text-text-primary mb-2">
					Score total: {n.toFixed(0)} / 100
				</p>
				<BreakdownRow label="Engagement quality" value={ew} max={40} />
				<BreakdownRow label="Creator tier" value={tw} max={30} />
				<BreakdownRow label="Consistencia" value={cw} max={20} />
				<BreakdownRow label="Historial campañas" value={hw} max={10} />
			</TooltipContent>
		</Tooltip>
	);
}
