"use client";

import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/ui/score-badge";
import { cn } from "@/lib/utils";
import type { CreatorRow } from "./types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFollowers(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
	return String(n);
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

// ── Sort icon ─────────────────────────────────────────────────────────────────

function SortIcon({ active, order }: { active: boolean; order: "asc" | "desc" }) {
	if (!active) return <ChevronsUpDown size={12} className="text-text-tertiary" />;
	return order === "asc" ? (
		<ChevronUp size={12} className="text-blue-400" />
	) : (
		<ChevronDown size={12} className="text-blue-400" />
	);
}

// ── Main table ─────────────────────────────────────────────────────────────────

interface CreatorsTableProps {
	rows: CreatorRow[];
	isLoading: boolean;
	isError: boolean;
	onRowClick?: (id: string) => void;
	sortBy?: "score" | "followers" | "created_at";
	sortOrder?: "asc" | "desc";
	onSort?: (by: "score" | "followers" | "created_at", order: "asc" | "desc") => void;
}

const STATIC_COLUMNS = [
	{ key: "creator", label: "Creador", width: "w-64", sortable: false },
	{ key: "city", label: "Ciudad", width: "w-28", sortable: false },
	{ key: "followersCount", label: "Seguidores", width: "w-28", sortable: false },
	{ key: "engagementRate", label: "Eng. rate", width: "w-24", sortable: false },
	{ key: "creatorTier", label: "Tier", width: "w-24", sortable: false },
	{ key: "engagementQuality", label: "Calidad", width: "w-28", sortable: false },
	{ key: "score", label: "Score", width: "w-20", sortable: true },
] as const;

export function CreatorsTable({
	rows,
	isLoading,
	isError,
	onRowClick,
	sortBy = "created_at",
	sortOrder = "desc",
	onSort,
}: CreatorsTableProps) {
	function handleSortScore() {
		if (!onSort) return;
		if (sortBy === "score") {
			onSort("score", sortOrder === "asc" ? "desc" : "asc");
		} else {
			onSort("score", "desc");
		}
	}

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
						{STATIC_COLUMNS.map((col) =>
							col.key === "score" ? (
								<th
									key={col.key}
									className={cn(
										"px-4 py-2.5 text-left text-xs font-medium text-text-tertiary uppercase tracking-wide",
										col.width,
										onSort && "cursor-pointer select-none hover:text-text-secondary"
									)}
									onClick={handleSortScore}
								>
									<span className="inline-flex items-center gap-1">
										{col.label}
										<SortIcon active={sortBy === "score"} order={sortOrder} />
									</span>
								</th>
							) : (
								<th
									key={col.key}
									className={cn(
										"px-4 py-2.5 text-left text-xs font-medium text-text-tertiary uppercase tracking-wide",
										col.width
									)}
								>
									{col.label}
								</th>
							)
						)}
					</tr>
				</thead>

				<tbody className="divide-y divide-border-default bg-bg-page">
					{/* Loading skeleton */}
					{isLoading &&
						["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8"].map((k) => <SkeletonRow key={k} />)}

					{/* Empty state */}
					{!isLoading && rows.length === 0 && (
						<tr>
							<td colSpan={STATIC_COLUMNS.length} className="px-4 py-16 text-center">
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
									<ScoreBadge score={row.score} />
								</td>
							</tr>
						))}
				</tbody>
			</table>
		</div>
	);
}
