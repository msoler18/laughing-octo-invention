"use client";

import { useRef, useState } from "react";
import { STATUS_LABELS } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ASSIGNMENT_STATUSES, type Assignment } from "./types";
import { useUpdateAssignmentStatus, useUpdatePostUrl } from "./use-campaign";

function ScoreCell({ score }: { score: string | null }) {
	if (!score) return <span className="text-text-tertiary font-mono">—</span>;
	const n = parseFloat(score);
	const color =
		n >= 75
			? "text-emerald-400"
			: n >= 50
				? "text-amber-400"
				: n >= 25
					? "text-orange-400"
					: "text-red-400";
	return <span className={cn("font-mono font-medium", color)}>{n.toFixed(0)}</span>;
}

function PostUrlCell({
	creatorId,
	campaignId,
	postUrl,
}: {
	creatorId: string;
	campaignId: string;
	postUrl: string | null;
}) {
	const [editing, setEditing] = useState(false);
	const [value, setValue] = useState(postUrl ?? "");
	const inputRef = useRef<HTMLInputElement>(null);
	const { mutate } = useUpdatePostUrl(campaignId);

	function save() {
		setEditing(false);
		if (value && value !== postUrl) {
			mutate({ creatorId, postUrl: value });
		}
	}

	if (editing) {
		return (
			<input
				ref={inputRef}
				// biome-ignore lint/a11y/noAutofocus: inline editor UX requires autofocus
				autoFocus
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onBlur={save}
				onKeyDown={(e) => {
					if (e.key === "Enter") save();
					if (e.key === "Escape") setEditing(false);
				}}
				placeholder="https://instagram.com/p/…"
				className="w-48 rounded bg-bg-elevated px-2 py-1 text-xs text-text-primary ring-1 ring-border-focus focus:outline-none"
			/>
		);
	}

	return (
		<button
			type="button"
			onClick={() => setEditing(true)}
			className="max-w-[160px] truncate text-xs text-left hover:text-blue-400 transition-colors"
			title={postUrl ?? "Click para añadir URL"}
		>
			{postUrl ? (
				<span className="text-blue-400 underline underline-offset-2">{postUrl}</span>
			) : (
				<span className="text-text-tertiary">+ Añadir URL</span>
			)}
		</button>
	);
}

function StatusSelect({
	campaignId,
	creatorId,
	current,
}: {
	campaignId: string;
	creatorId: string;
	current: string;
}) {
	const { mutate, isPending } = useUpdateAssignmentStatus(campaignId);

	return (
		<select
			value={current}
			disabled={isPending}
			onChange={(e) =>
				mutate({ creatorId, status: e.target.value as Assignment["assignmentStatus"] })
			}
			className="rounded bg-bg-elevated px-2 py-1 text-xs ring-1 ring-border-default focus:outline-none focus:ring-border-focus disabled:opacity-50"
		>
			{ASSIGNMENT_STATUSES.map((s) => (
				<option key={s} value={s}>
					{STATUS_LABELS[s]}
				</option>
			))}
		</select>
	);
}

export function AssignmentsTable({
	assignments,
	campaignId,
}: {
	assignments: Assignment[];
	campaignId: string;
}) {
	if (assignments.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center rounded-lg ring-1 ring-border-default">
				<p className="text-sm font-medium text-text-primary">Sin creadores asignados</p>
				<p className="mt-1 text-xs text-text-tertiary">
					Añade creadores desde la vista de Creadores.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto rounded-lg ring-1 ring-border-default">
			<table className="min-w-full divide-y divide-border-default text-sm">
				<thead className="bg-bg-surface">
					<tr>
						{["Creador", "Estado", "Post URL", "Impresiones", "Alcance", "Score", "Asignado"].map(
							(h) => (
								<th
									key={h}
									className="px-4 py-2.5 text-left text-xs font-medium text-text-tertiary uppercase tracking-wide whitespace-nowrap"
								>
									{h}
								</th>
							)
						)}
					</tr>
				</thead>
				<tbody className="divide-y divide-border-default bg-bg-page">
					{assignments.map((a) => (
						<tr key={a.id} className="hover:bg-bg-surface transition-colors">
							<td className="px-4 py-3 whitespace-nowrap">
								<p className="font-medium text-text-primary">{a.fullName}</p>
								<p className="text-xs text-text-tertiary font-mono">@{a.instagramHandle}</p>
							</td>
							<td className="px-4 py-3 whitespace-nowrap">
								<StatusSelect
									campaignId={campaignId}
									creatorId={a.creatorId}
									current={a.assignmentStatus}
								/>
							</td>
							<td className="px-4 py-3">
								<PostUrlCell campaignId={campaignId} creatorId={a.creatorId} postUrl={a.postUrl} />
							</td>
							<td className="px-4 py-3 font-mono text-text-secondary">
								{a.impressions?.toLocaleString("es-CO") ?? "—"}
							</td>
							<td className="px-4 py-3 font-mono text-text-secondary">
								{a.reach?.toLocaleString("es-CO") ?? "—"}
							</td>
							<td className="px-4 py-3">
								<ScoreCell score={a.score} />
							</td>
							<td className="px-4 py-3 text-xs text-text-tertiary whitespace-nowrap">
								{new Date(a.assignedAt).toLocaleDateString("es-CO")}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
