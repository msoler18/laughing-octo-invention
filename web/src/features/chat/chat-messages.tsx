"use client";

import type { UIMessage } from "ai";
import { type CreatorCard, CreatorResultCards } from "./creator-result-cards";

// ── Tool label map ────────────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
	searchCreators: "Búsqueda de creadores",
	queryCampaign: "Consulta de campaña",
	findSimilarCreators: "Creadores similares",
};

// ── Extract creator cards from tool output ────────────────────────────────────

function extractCreators(output: unknown): CreatorCard[] | null {
	if (!output || typeof output !== "object") return null;
	const o = output as Record<string, unknown>;
	if (Array.isArray(o.results)) return (o.results as CreatorCard[]).filter((r) => r.id);
	if (Array.isArray(o.similar)) return (o.similar as CreatorCard[]).filter((r) => r.id);
	return null;
}

// ── Bouncing dots ─────────────────────────────────────────────────────────────

function BounceDots({ color = "bg-violet-400" }: { color?: string }) {
	return (
		<span className="ml-auto flex gap-0.5">
			{(["a", "b", "c"] as const).map((k) => (
				<span
					key={k}
					className={`h-1 w-1 rounded-full ${color} animate-bounce`}
					style={{ animationDelay: k === "a" ? "0ms" : k === "b" ? "150ms" : "300ms" }}
				/>
			))}
		</span>
	);
}

// ── Tool part shape (dynamic-tool union narrowed manually) ───────────────────

interface ToolPartShape {
	type: string;
	toolName: string;
	toolCallId: string;
	state: "input-streaming" | "input-available" | "output-available" | "output-error";
	input?: unknown;
	output?: unknown;
}

// ── Tool invocation card (M6-08) ──────────────────────────────────────────────

function ToolCard({ part }: { part: ToolPartShape }) {
	const label = TOOL_LABELS[part.toolName] ?? part.toolName;
	const isPending = part.state === "input-streaming" || part.state === "input-available";
	const isError = part.state === "output-error";
	const hasOutput = part.state === "output-available";

	const creators = hasOutput ? extractCreators(part.output) : null;

	return (
		<div className="rounded-lg ring-1 ring-violet-500/30 bg-violet-500/5 px-3 py-2.5 space-y-2 text-xs">
			{/* Header */}
			<div className="flex items-center gap-2">
				<span className="inline-flex h-4 w-4 items-center justify-center rounded bg-violet-500/20 text-violet-400 text-[9px] font-bold">
					⚙
				</span>
				<span className="font-medium text-violet-300">{label}</span>
				{isPending && <BounceDots />}
				{isError && <span className="ml-auto text-red-400 text-[10px]">Error</span>}
				{!isPending && !isError && (
					<span className="ml-auto text-[10px] text-violet-400/60">✓ Completado</span>
				)}
			</div>

			{/* Compact params (shown while calling) */}
			{part.input != null && typeof part.input === "object" && (
				<div className="flex flex-wrap gap-1">
					{Object.entries(part.input as Record<string, unknown>)
						.filter(([, v]) => v !== undefined && v !== null && v !== "")
						.map(([k, v]) => (
							<span
								key={k}
								className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-mono text-violet-300"
							>
								{k}: {String(v)}
							</span>
						))}
				</div>
			)}

			{/* M6-09 — Creator result mini-cards */}
			{creators && creators.length > 0 && <CreatorResultCards creators={creators} />}
		</div>
	);
}

// ── Thinking dots (M6-10) ─────────────────────────────────────────────────────

export function ThinkingDots() {
	return (
		<div className="flex items-center gap-1 px-3 py-2">
			{(["a", "b", "c"] as const).map((k) => (
				<span
					key={k}
					className="h-1.5 w-1.5 rounded-full bg-text-tertiary animate-bounce"
					style={{ animationDelay: k === "a" ? "0ms" : k === "b" ? "150ms" : "300ms" }}
				/>
			))}
		</div>
	);
}

// ── Message list (M6-08 / M6-10) ──────────────────────────────────────────────

export function ChatMessages({
	messages,
	isStreaming,
}: {
	messages: UIMessage[];
	isStreaming: boolean;
}) {
	const lastIsAssistant =
		messages.length > 0 && messages[messages.length - 1]?.role === "assistant";

	return (
		<div className="flex flex-col gap-3 py-4 px-4">
			{messages.map((message) => (
				<div
					key={message.id}
					className={message.role === "user" ? "flex justify-end" : "flex flex-col gap-2"}
				>
					{message.role === "user" ? (
						// User bubble
						<div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-3 py-2 text-xs text-white">
							{message.parts
								.filter((p) => p.type === "text")
								.map((p, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: ordered static parts
									<p key={i} className="whitespace-pre-wrap">
										{p.text}
									</p>
								))}
						</div>
					) : (
						// Assistant — render each part
						<div className="flex flex-col gap-2">
							{message.parts.map((part, i) => {
								if (part.type === "text") {
									return (
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: ordered static parts
											key={i}
											className="max-w-[90%] rounded-2xl rounded-tl-sm bg-bg-elevated px-3 py-2 text-xs text-text-primary whitespace-pre-wrap"
										>
											{part.text}
										</div>
									);
								}

								// M6-08 — Tool invocation cards
								if (part.type === "dynamic-tool") {
									return (
										// biome-ignore lint/suspicious/noArrayIndexKey: ordered static parts
										<ToolCard key={i} part={part as ToolPartShape} />
									);
								}

								return null;
							})}
						</div>
					)}
				</div>
			))}

			{/* M6-10 — Thinking indicator before first assistant token */}
			{isStreaming && !lastIsAssistant && <ThinkingDots />}
		</div>
	);
}
