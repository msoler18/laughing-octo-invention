"use client";

import { Button } from "@/components/ui/button";
import type { CreatorsFilters, CreatorTier, EngagementQuality } from "./types";

interface CreatorsFiltersProps {
	filters: CreatorsFilters;
	onChange: (next: CreatorsFilters) => void;
}

const TIER_OPTIONS: { value: CreatorTier; label: string }[] = [
	{ value: "nano", label: "Nano  (<10K)" },
	{ value: "micro", label: "Micro (10–100K)" },
	{ value: "mid", label: "Mid   (100K–500K)" },
	{ value: "macro", label: "Macro (500K–1M)" },
	{ value: "mega", label: "Mega  (>1M)" },
];

const QUALITY_OPTIONS: { value: EngagementQuality; label: string }[] = [
	{ value: "zero", label: "Zero" },
	{ value: "low", label: "Bajo" },
	{ value: "average", label: "Promedio" },
	{ value: "high", label: "Alto" },
	{ value: "viral", label: "Viral" },
];

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
	return (
		<label htmlFor={htmlFor} className="block text-xs font-medium text-text-secondary mb-1">
			{children}
		</label>
	);
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { id?: string }) {
	return (
		<input
			className="w-full rounded-lg bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary ring-1 ring-border-default focus:outline-none focus:ring-border-focus"
			{...props}
		/>
	);
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { id?: string }) {
	return (
		<select
			className="w-full rounded-lg bg-bg-elevated px-3 py-2 text-sm text-text-primary ring-1 ring-border-default focus:outline-none focus:ring-border-focus"
			{...props}
		/>
	);
}

export function CreatorsFiltersPanel({ filters, onChange }: CreatorsFiltersProps) {
	function set<K extends keyof CreatorsFilters>(key: K, value: CreatorsFilters[K]) {
		onChange({ ...filters, [key]: value || undefined, page: 1 });
	}

	function reset() {
		onChange({ page: 1, limit: filters.limit });
	}

	const hasActiveFilters =
		filters.city ||
		filters.tier ||
		filters.engagement_quality ||
		filters.followers_min ||
		filters.followers_max ||
		filters.category;

	return (
		<aside className="w-56 shrink-0 space-y-5">
			<div className="flex items-center justify-between">
				<p className="text-xs font-semibold text-text-primary uppercase tracking-wide">Filtros</p>
				{hasActiveFilters && (
					<button
						type="button"
						onClick={reset}
						className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
					>
						Limpiar
					</button>
				)}
			</div>

			{/* City */}
			<div>
				<Label htmlFor="filter-city">Ciudad</Label>
				<Input
					id="filter-city"
					placeholder="Bogotá, Medellín…"
					value={filters.city ?? ""}
					onChange={(e) => set("city", e.target.value)}
				/>
			</div>

			{/* Category slug */}
			<div>
				<Label htmlFor="filter-category">Categoría</Label>
				<Input
					id="filter-category"
					placeholder="lifestyle, fitness…"
					value={filters.category ?? ""}
					onChange={(e) => set("category", e.target.value)}
				/>
			</div>

			{/* Tier */}
			<div>
				<Label htmlFor="filter-tier">Tier</Label>
				<Select
					id="filter-tier"
					value={filters.tier ?? ""}
					onChange={(e) => set("tier", (e.target.value as CreatorTier) || undefined)}
				>
					<option value="">Todos</option>
					{TIER_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</Select>
			</div>

			{/* Engagement quality */}
			<div>
				<Label htmlFor="filter-quality">Calidad de engagement</Label>
				<Select
					id="filter-quality"
					value={filters.engagement_quality ?? ""}
					onChange={(e) =>
						set("engagement_quality", (e.target.value as EngagementQuality) || undefined)
					}
				>
					<option value="">Todas</option>
					{QUALITY_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</Select>
			</div>

			{/* Followers range */}
			<div>
				<Label htmlFor="filter-followers-min">Seguidores mínimo</Label>
				<Input
					id="filter-followers-min"
					type="number"
					min={0}
					placeholder="0"
					value={filters.followers_min ?? ""}
					onChange={(e) =>
						set("followers_min", e.target.value ? Number(e.target.value) : undefined)
					}
				/>
			</div>
			<div>
				<Label htmlFor="filter-followers-max">Seguidores máximo</Label>
				<Input
					id="filter-followers-max"
					type="number"
					min={0}
					placeholder="1000000"
					value={filters.followers_max ?? ""}
					onChange={(e) =>
						set("followers_max", e.target.value ? Number(e.target.value) : undefined)
					}
				/>
			</div>

			<Button variant="secondary" size="sm" className="w-full" onClick={reset}>
				Limpiar filtros
			</Button>
		</aside>
	);
}
