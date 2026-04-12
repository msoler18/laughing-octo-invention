"use client";

import { ScoreBadge } from "@/components/ui/score-badge";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreatorCard {
	id: string;
	instagramHandle: string;
	fullName: string;
	city: string | null;
	tier?: string;
	score?: string | null;
	similarity?: number; // 0-100, from findSimilarCreators
}

// ── Letter avatar ─────────────────────────────────────────────────────────────

function LetterAvatar({ name }: { name: string }) {
	return (
		<span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-400/15 text-violet-300 text-xs font-semibold uppercase">
			{name.charAt(0)}
		</span>
	);
}

// ── Single card ───────────────────────────────────────────────────────────────

function SingleCreatorCard({ creator }: { creator: CreatorCard }) {
	return (
		<div className="flex items-center gap-2.5 rounded-lg bg-bg-page ring-1 ring-border-default px-3 py-2">
			<LetterAvatar name={creator.fullName} />
			<div className="min-w-0 flex-1">
				<p className="truncate text-xs font-medium text-text-primary">{creator.fullName}</p>
				<p className="truncate text-xs text-text-tertiary font-mono">@{creator.instagramHandle}</p>
			</div>
			<div className="shrink-0 flex flex-col items-end gap-0.5">
				{creator.score && <ScoreBadge score={creator.score} />}
				{creator.similarity !== undefined && (
					<span className="text-[10px] font-mono text-text-tertiary">{creator.similarity}%</span>
				)}
				{creator.city && <span className="text-[10px] text-text-tertiary">{creator.city}</span>}
			</div>
		</div>
	);
}

// ── Creator result list (M6-09) ────────────────────────────────────────────────

export function CreatorResultCards({ creators }: { creators: CreatorCard[] }) {
	if (creators.length === 0) return null;

	return (
		<div className="space-y-1.5 mt-2">
			{creators.map((c) => (
				<SingleCreatorCard key={c.id} creator={c} />
			))}
		</div>
	);
}
