"use client";

import { Badge, statusVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CreatorRow } from "./types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFollowers(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
	return String(n);
}

function scoreColor(score: string | null): string {
	if (!score) return "text-text-tertiary";
	const n = parseFloat(score);
	if (n >= 75) return "text-emerald-400";
	if (n >= 50) return "text-amber-400";
	if (n >= 25) return "text-orange-400";
	return "text-red-400";
}

function LetterAvatar({ name }: { name: string }) {
	return (
		<span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-400/15 text-blue-300 text-xs font-semibold uppercase">
			{name.charAt(0)}
		</span>
	);
}

// ── Skeleton row (M2-09) ──────────────────────────────────────────────────────

function SkeletonRow() {
	const cols = ["name", "city", "followers", "eng", "tier", "quality", "score"] as const;
	return (
		<tr className="border-b border-border-default">
			{cols.map((k, i) => (
				<td key={k} className="px-4 py-3">
					<div
						className={cn("h-4 rounded bg-bg-elevated animate-pulse", i === 0 ? "w-40" : "w-20")}
					/>
				</td>
			))}
		</tr>
	);
}

// ── Main table ─────────────────────────────────────────────────────────────────

interface CreatorsTableProps {
	rows: CreatorRow[];
	isLoading: boolean;
	isError: boolean;
	onRowClick?: (id: string) => void;
}

const COLUMNS = [
	{ key: "creator", label: "Creador", width: "w-64" },
	{ key: "city", label: "Ciudad", width: "w-28" },
	{ key: "followersCount", label: "Seguidores", width: "w-28" },
	{ key: "engagementRate", label: "Eng. rate", width: "w-24" },
	{ key: "creatorTier", label: "Tier", width: "w-24" },
	{ key: "engagementQuality", label: "Calidad", width: "w-28" },
	{ key: "score", label: "Score", width: "w-20" },
];

export function CreatorsTable({ rows, isLoading, isError, onRowClick }: CreatorsTableProps) {
	// ── Error state ───────────────────────────────────────────────────────────
	if (isError) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<p className="text-sm font-medium text-text-primary">Error al cargar creadores</p>
				<p className="mt-1 text-xs text-text-tertiary">
					Verifica que el servidor esté corriendo en el puerto 3001.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto rounded-lg ring-1 ring-border-default">
			<table className="min-w-full divide-y divide-border-default text-sm">
				<thead className="bg-bg-surface">
					<tr>
						{COLUMNS.map((col) => (
							<th
								key={col.key}
								className={cn(
									"px-4 py-2.5 text-left text-xs font-medium text-text-tertiary uppercase tracking-wide",
									col.width
								)}
							>
								{col.label}
							</th>
						))}
					</tr>
				</thead>

				<tbody className="divide-y divide-border-default bg-bg-page">
					{/* Loading skeleton */}
					{isLoading &&
						["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8"].map((k) => <SkeletonRow key={k} />)}

					{/* Empty state */}
					{!isLoading && rows.length === 0 && (
						<tr>
							<td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
								<p className="text-sm font-medium text-text-primary">Sin resultados</p>
								<p className="mt-1 text-xs text-text-tertiary">
									Ajusta los filtros o importa creadores con un CSV.
								</p>
							</td>
						</tr>
					)}

					{/* Data rows */}
					{!isLoading &&
						rows.map((row) => (
							<tr
								key={row.id}
								onClick={() => onRowClick?.(row.id)}
								className={cn(
									"transition-colors",
									onRowClick && "cursor-pointer hover:bg-bg-surface"
								)}
							>
								{/* Creator identity */}
								<td className="px-4 py-3">
									<div className="flex items-center gap-3">
										<LetterAvatar name={row.fullName} />
										<div className="min-w-0">
											<p className="truncate font-medium text-text-primary">{row.fullName}</p>
											<p className="truncate text-xs text-text-tertiary font-mono">
												@{row.instagramHandle}
											</p>
										</div>
									</div>
								</td>

								<td className="px-4 py-3 text-text-secondary">
									{row.city ?? <span className="text-text-tertiary">—</span>}
								</td>

								<td className="px-4 py-3 font-mono text-text-secondary">
									{formatFollowers(row.followersCount)}
								</td>

								<td className="px-4 py-3 font-mono text-text-secondary">
									{parseFloat(row.engagementRate).toFixed(1)}%
								</td>

								<td className="px-4 py-3">
									<Badge variant={statusVariant(row.creatorTier)}>{row.creatorTier}</Badge>
								</td>

								<td className="px-4 py-3">
									<Badge variant={statusVariant(row.engagementQuality)}>
										{row.engagementQuality}
									</Badge>
								</td>

								<td className="px-4 py-3">
									<span className={cn("font-mono font-medium", scoreColor(row.score))}>
										{row.score ? parseFloat(row.score).toFixed(0) : "—"}
									</span>
								</td>
							</tr>
						))}
				</tbody>
			</table>
		</div>
	);
}
