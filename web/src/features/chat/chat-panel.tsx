"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageSquare, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatMessages, ThinkingDots } from "./chat-messages";

// ── M6-11  Suggested example queries ─────────────────────────────────────────

const EXAMPLE_QUERIES = [
	"Busca creadores micro de Medellín con engagement viral",
	"¿Quiénes aún no han publicado en la campaña actual?",
	"Muéstrame creadores similares a uno que ya tengo",
	"Creadores con más de 50K seguidores en Bogotá",
	"¿Cuántos están en etapa de brief?",
];

// ── Chat Panel (M6-07) ────────────────────────────────────────────────────────

interface ChatPanelProps {
	campaignId?: string;
}

export function ChatPanel({ campaignId }: ChatPanelProps) {
	const [open, setOpen] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

	const { messages, sendMessage, status, error } = useChat({
		transport: new DefaultChatTransport({
			api: `${API}/api/v1/chat`,
			body: campaignId ? { campaignId } : undefined,
		}),
	});

	const isLoading = status === "submitted" || status === "streaming";

	// M6-07 — keyboard shortcut Cmd+/ or Ctrl+/
	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === "/") {
				e.preventDefault();
				setOpen((v) => !v);
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	// Auto-scroll to bottom on new messages / loading state
	// biome-ignore lint/correctness/useExhaustiveDependencies: scrolling on messages/loading is intentional
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [messages, isLoading]);

	// Focus textarea when panel opens
	useEffect(() => {
		if (open) {
			setTimeout(() => textareaRef.current?.focus(), 50);
		}
	}, [open]);

	function handleSend() {
		const text = inputValue.trim();
		if (!text || isLoading) return;
		setInputValue("");
		sendMessage({ text });
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	function handleExampleClick(query: string) {
		setInputValue(query);
		textareaRef.current?.focus();
	}

	const isEmpty = messages.length === 0;

	return (
		<>
			{/* Floating toggle button (visible when closed) */}
			{!open && (
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-500 transition-colors"
					title="Abrir asistente IA (⌘/)"
				>
					<Sparkles size={18} />
				</button>
			)}

			{/* Panel */}
			{open && (
				<div className="fixed inset-y-0 right-0 z-40 flex w-96 flex-col bg-bg-surface border-l border-border-default shadow-2xl">
					{/* Header */}
					<div className="flex h-14 shrink-0 items-center gap-3 border-b border-border-default px-4">
						<Sparkles size={15} className="text-violet-400 shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold text-text-primary">Asistente RealUp</p>
							<p className="text-[10px] text-text-tertiary">IA · gpt-4o-mini</p>
						</div>
						<button
							type="button"
							onClick={() => setOpen(false)}
							aria-label="Cerrar asistente"
							className="rounded p-1 text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors"
						>
							<X size={15} />
						</button>
					</div>

					{/* Messages area */}
					<div ref={scrollRef} className="flex-1 overflow-y-auto">
						{isEmpty ? (
							/* M6-11 — Suggested queries on first open */
							<div className="flex flex-col gap-4 p-4">
								<div className="text-center pt-6">
									<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
										<MessageSquare size={22} className="text-violet-400" />
									</div>
									<p className="text-sm font-medium text-text-primary">¿En qué te ayudo?</p>
									<p className="mt-1 text-xs text-text-tertiary">
										Busca creadores, consulta campañas o descubre perfiles similares.
									</p>
								</div>
								<div className="space-y-2">
									{EXAMPLE_QUERIES.map((q) => (
										<button
											key={q}
											type="button"
											onClick={() => handleExampleClick(q)}
											className="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 text-left text-xs text-text-secondary hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-violet-300 transition-colors"
										>
											{q}
										</button>
									))}
								</div>
							</div>
						) : (
							<ChatMessages messages={messages} isStreaming={isLoading} />
						)}

						{/* M6-10 — Thinking indicator when loading with existing messages */}
						{isLoading && messages.length > 0 && (
							<div className="px-4 pb-2">
								<ThinkingDots />
							</div>
						)}
					</div>

					{/* Error banner */}
					{error && (
						<div className="mx-4 mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 ring-1 ring-red-500/20">
							{error.message.includes("503")
								? "El modelo de IA está sobrecargado. Intenta en unos segundos."
								: "Error al conectar con el asistente."}
						</div>
					)}

					{/* Input */}
					<div className="shrink-0 border-t border-border-default p-3">
						<div className="flex items-end gap-2 rounded-xl bg-bg-elevated ring-1 ring-border-default focus-within:ring-violet-500/50 transition-shadow px-3 py-2">
							<textarea
								ref={textareaRef}
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Escribe tu consulta… (Enter para enviar)"
								rows={1}
								disabled={isLoading}
								className="flex-1 resize-none bg-transparent text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none disabled:opacity-50"
								style={{ maxHeight: "120px", overflowY: "auto" }}
							/>
							<button
								type="button"
								onClick={handleSend}
								disabled={isLoading || !inputValue.trim()}
								className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
							>
								<Send size={13} />
							</button>
						</div>
						<p className="mt-1.5 text-center text-[10px] text-text-tertiary">
							⌘/ para abrir · Enter para enviar · Shift+Enter nueva línea
						</p>
					</div>
				</div>
			)}
		</>
	);
}
