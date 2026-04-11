"use client";

import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	useDraggable,
	useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Badge, STATUS_LABELS, statusVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ASSIGNMENT_STATUSES, type Assignment, type AssignmentStatus } from "./types";
import { useUpdateAssignmentStatus } from "./use-campaign";

// ── Draggable card ────────────────────────────────────────────────────────────

function KanbanCard({ assignment, isDragging }: { assignment: Assignment; isDragging?: boolean }) {
	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id: assignment.creatorId,
		data: { assignment },
	});

	const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className={cn(
				"rounded-lg bg-bg-elevated ring-1 ring-border-default p-3 cursor-grab active:cursor-grabbing",
				"select-none touch-none",
				isDragging && "opacity-50"
			)}
		>
			<p className="text-xs font-medium text-text-primary truncate">{assignment.fullName}</p>
			<p className="text-xs text-text-tertiary font-mono truncate">@{assignment.instagramHandle}</p>
			{assignment.score && (
				<p className="mt-1.5 text-xs font-mono text-text-tertiary">
					Score:{" "}
					<span className="text-text-secondary">{parseFloat(assignment.score).toFixed(0)}</span>
				</p>
			)}
		</div>
	);
}

// ── Droppable column ──────────────────────────────────────────────────────────

function KanbanColumn({
	status,
	assignments,
	activeId,
}: {
	status: AssignmentStatus;
	assignments: Assignment[];
	activeId: string | null;
}) {
	const { setNodeRef, isOver } = useDroppable({ id: status });

	return (
		<div className="flex w-52 shrink-0 flex-col gap-2">
			{/* Column header */}
			<div className="flex items-center justify-between">
				<Badge variant={statusVariant(status)}>{STATUS_LABELS[status]}</Badge>
				<span className="text-xs font-mono text-text-tertiary">{assignments.length}</span>
			</div>

			{/* Drop zone */}
			<div
				ref={setNodeRef}
				className={cn(
					"flex flex-1 flex-col gap-2 rounded-lg p-2 min-h-24 transition-colors",
					isOver
						? "bg-blue-400/10 ring-1 ring-blue-400/30"
						: "bg-bg-surface ring-1 ring-border-default"
				)}
			>
				{assignments.map((a) => (
					<KanbanCard key={a.creatorId} assignment={a} isDragging={activeId === a.creatorId} />
				))}
				{assignments.length === 0 && (
					<p className="text-center text-xs text-text-tertiary py-4">Sin creadores</p>
				)}
			</div>
		</div>
	);
}

// ── Board ─────────────────────────────────────────────────────────────────────

export function AssignmentsKanban({
	assignments,
	campaignId,
}: {
	assignments: Assignment[];
	campaignId: string;
}) {
	const [activeId, setActiveId] = useState<string | null>(null);
	const { mutate } = useUpdateAssignmentStatus(campaignId);

	const byStatus = Object.fromEntries(
		ASSIGNMENT_STATUSES.map((s) => [s, assignments.filter((a) => a.assignmentStatus === s)])
	) as Record<AssignmentStatus, Assignment[]>;

	const activeAssignment = activeId ? assignments.find((a) => a.creatorId === activeId) : null;

	function handleDragEnd(event: DragEndEvent) {
		setActiveId(null);
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const newStatus = over.id as AssignmentStatus;
		const assignment = (active.data.current as { assignment: Assignment }).assignment;

		if (assignment.assignmentStatus === newStatus) return;

		mutate({ creatorId: String(active.id), status: newStatus });
	}

	return (
		<DndContext
			onDragStart={(e) => setActiveId(String(e.active.id))}
			onDragEnd={handleDragEnd}
			onDragCancel={() => setActiveId(null)}
		>
			<div className="flex gap-3 overflow-x-auto pb-4">
				{ASSIGNMENT_STATUSES.map((status) => (
					<KanbanColumn
						key={status}
						status={status}
						assignments={byStatus[status]}
						activeId={activeId}
					/>
				))}
			</div>

			{/* Ghost card while dragging */}
			<DragOverlay>
				{activeAssignment && (
					<div className="rounded-lg bg-bg-elevated ring-1 ring-blue-400/50 shadow-3 p-3 w-52 rotate-2">
						<p className="text-xs font-medium text-text-primary">{activeAssignment.fullName}</p>
						<p className="text-xs text-text-tertiary font-mono">
							@{activeAssignment.instagramHandle}
						</p>
					</div>
				)}
			</DragOverlay>
		</DndContext>
	);
}
