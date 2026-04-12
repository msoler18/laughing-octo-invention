"use client";

import { AlertCircle, Search, Sparkles, X } from "lucide-react";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppliedFilters } from "./types";

// ── Filter chip labels ────────────────────────────────────────────────────────

function chipLabel(key: keyof AppliedFilters, value: unknown): string {
	switch (key) {
		case "city":
			return `Ciudad: ${value}`;
		case "tier":
			return `Tier: ${value}`;
		case "engagement_quality":
			return `Engagement: ${value}`;
		case "followers_min":
			return `> ${Number(value).toLocaleString("es-CO")} seg.`;
		case "followers_max":
			return `< ${Number(value).toLocaleString("es-CO")} seg.`;
		case "category_slugs":
			return `Categorías: ${(value as string[]).join(", ")}`;
		default:
			return `${key}: ${value}`;
	}
}

// ── Filter chips row (M4-07/08) ───────────────────────────────────────────────

interface FilterChip {
	key: keyof AppliedFilters;
	value: unknown;
}

function FilterChips({
	chips,
	onRemove,
}: {
	chips: FilterChip[];
	onRemove: (key: keyof AppliedFilters) => void;
}) {
	if (chips.length === 0) return null;
	return (
		<div className="flex flex-wrap gap-1.5 mt-2">
			{chips.map(({ key, value }) => (
				<span
					key={key}
					className="inline-flex items-center gap-1 rounded-full bg-violet-400/10 px-2.5 py-0.5 text-xs font-medium text-violet-300 ring-1 ring-violet-400/30"
				>
					{chipLabel(key, value)}
					<button
						type="button"
						onClick={() => onRemove(key)}
						className="ml-0.5 rounded-full hover:text-violet-100 transition-colors"
						aria-label={`Quitar filtro ${key}`}
					>
						<X size={10} />
					</button>
				</span>
			))}
		</div>
	);
}

// ── Main RAGSearch input + status (M4-06) ─────────────────────────────────────

interface RAGSearchProps {
	inputValue: string;
	onChange: (v: string) => void;
	onSearch: (q: string) => void;
	onClear: () => void;
	isActive: boolean;
	isFetching: boolean;
	chips: FilterChip[];
	onRemoveFilter: (key: keyof AppliedFilters) => void;
	total: number;
	embeddingsPending: number;
}

export function RAGSearch({
	inputValue,
	onChange,
	onSearch,
	onClear,
	isActive,
	isFetching,
	chips,
	onRemoveFilter,
	total,
	embeddingsPending,
}: RAGSearchProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<div className="w-full">
			{/* Input row */}
			<div
				className={cn(
					"flex items-center gap-2 rounded-xl px-3 py-2 ring-1 transition-colors bg-bg-surface",
					isActive ? "ring-violet-400/50" : "ring-border-default focus-within:ring-violet-400/50"
				)}
			>
				{/* M4-06 — violet Sparkles icon */}
				<Sparkles size={15} className="shrink-0 text-violet-400" />

				<input
					ref={inputRef}
					value={inputValue}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") onSearch(inputValue);
						if (e.key === "Escape") onClear();
					}}
					placeholder="Busca: micro creadores de fitness en Medellín con alto engagement…"
					className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
				/>

				{isActive ? (
					<button
						type="button"
						onClick={onClear}
						className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
						aria-label="Limpiar búsqueda"
					>
						<X size={14} />
					</button>
				) : (
					<button
						type="button"
						onClick={() => onSearch(inputValue)}
						className="shrink-0 text-text-tertiary hover:text-violet-400 transition-colors"
						aria-label="Buscar"
					>
						<Search size={14} />
					</button>
				)}
			</div>

			{/* M4-07 — extracted filter chips */}
			<FilterChips chips={chips} onRemove={onRemoveFilter} />

			{/* M4-09 — results indicator */}
			{isActive && !isFetching && (
				<p className="mt-1.5 text-xs text-text-tertiary">
					<span className="text-text-secondary font-medium">{total}</span> creadores encontrados
					{chips.length > 0 && (
						<span className="text-violet-400">
							{" "}
							· búsqueda semántica con {chips.length} {chips.length === 1 ? "filtro" : "filtros"}
						</span>
					)}
				</p>
			)}

			{/* M4-10 — fallback warning when embeddings not ready */}
			{isActive && !isFetching && embeddingsPending > 0 && (
				<div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
					<AlertCircle size={12} className="shrink-0" />
					<span>
						Búsqueda semántica parcial — <span className="font-medium">{embeddingsPending}</span>{" "}
						creadores aún sin vectorizar.
					</span>
				</div>
			)}
		</div>
	);
}

// ── RAG results table ─────────────────────────────────────────────────────────

import { statusVariant } from "@/components/ui/badge";
import type { SearchResult } from "./types";

export function RAGResultsTable({
	results,
	isLoading,
	onRowClick,
}: {
	results: SearchResult[];
	isLoading: boolean;
	onRowClick?: (id: string) => void;
}) {
	if (isLoading) {
		return (
			<div className="overflow-x-auto rounded-lg ring-1 ring-border-default">
				<table className="min-w-full text-sm">
					<thead className="bg-bg-surface">
						<tr>
							{["Creador", "Relevancia", "Tier", "Seguidores", "Engagement", "Score"].map((h) => (
								<th
									key={h}
									className="px-4 py-2.5 text-left text-xs font-medium text-text-tertiary uppercase tracking-wide whitespace-nowrap"
								>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-border-default bg-bg-page">
						{["a", "b", "c", "d", "e"].map((k) => (
							<tr key={k}>
								{["w-40", "w-16", "w-20", "w-24", "w-24", "w-16"].map((w, i) => (
									<td key={w + String(i)} className="px-4 py-3">
										<div className={cn("h-4 rounded bg-bg-elevated animate-pulse", w)} />
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	}

	if (results.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center rounded-lg ring-1 ring-border-default">
				<p className="text-sm font-medium text-text-primary">Sin resultados</p>
				<p className="mt-1 text-xs text-text-tertiary">
					Prueba con una consulta diferente o quita algún filtro.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto rounded-lg ring-1 ring-border-default">
			<table className="min-w-full divide-y divide-border-default text-sm">
				<thead className="bg-bg-surface">
					<tr>
						{["Creador", "Relevancia", "Tier", "Seguidores", "Engagement", "Score"].map((h) => (
							<th
								key={h}
								className="px-4 py-2.5 text-left text-xs font-medium text-text-tertiary uppercase tracking-wide whitespace-nowrap"
							>
								{h}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-border-default bg-bg-page">
					{results.map((r) => (
						<tr
							key={r.id}
							onClick={() => onRowClick?.(r.id)}
							className={cn(
								"transition-colors",
								onRowClick && "cursor-pointer hover:bg-bg-surface"
							)}
						>
							<td className="px-4 py-3 whitespace-nowrap">
								<p className="font-medium text-text-primary">{r.fullName}</p>
								<p className="text-xs text-text-tertiary font-mono">@{r.instagramHandle}</p>
								{r.city && <p className="text-xs text-text-tertiary">{r.city}</p>}
							</td>
							{/* Semantic score bar */}
							<td className="px-4 py-3 whitespace-nowrap">
								<div className="flex items-center gap-2">
									<div className="w-16 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
										<div
											className="h-full rounded-full bg-violet-400"
											style={{ width: `${Math.round(r.semanticScore * 100)}%` }}
										/>
									</div>
									<span className="text-xs font-mono text-text-tertiary">
										{Math.round(r.semanticScore * 100)}%
									</span>
								</div>
							</td>
							<td className="px-4 py-3">
								<Badge variant={statusVariant(r.creatorTier)}>{r.creatorTier}</Badge>
							</td>
							<td className="px-4 py-3 font-mono text-text-secondary">
								{r.followersCount.toLocaleString("es-CO")}
							</td>
							<td className="px-4 py-3">
								<Badge variant={statusVariant(r.engagementQuality)}>{r.engagementQuality}</Badge>
							</td>
							<td className="px-4 py-3 font-mono text-text-secondary">
								{r.score ? parseFloat(r.score).toFixed(0) : "—"}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
