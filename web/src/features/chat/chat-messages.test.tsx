import { render, screen } from "@testing-library/react";
import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { ChatMessages } from "./chat-messages";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUserMessage(text: string): UIMessage {
	return {
		id: "u1",
		role: "user",
		parts: [{ type: "text", text }],
	};
}

function makeAssistantText(text: string): UIMessage {
	return {
		id: "a1",
		role: "assistant",
		parts: [{ type: "text", text }],
	};
}

function makeToolMessage(
	state: "input-streaming" | "input-available" | "output-available" | "output-error",
	output?: unknown
): UIMessage {
	return {
		id: "a2",
		role: "assistant",
		parts: [
			{
				type: "dynamic-tool",
				toolName: "searchCreators",
				toolCallId: "tc1",
				state,
				input: { query: "micro Medellín" },
				output,
			} as never,
		],
	};
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ChatMessages", () => {
	it("renders user bubble on the right", () => {
		render(<ChatMessages messages={[makeUserMessage("Hola")]} isStreaming={false} />);
		expect(screen.getByText("Hola")).toBeInTheDocument();
		// user messages are inside a flex justify-end wrapper
		const bubble = screen.getByText("Hola").closest("div[class*='justify-end']");
		expect(bubble).toBeInTheDocument();
	});

	it("renders assistant text bubble", () => {
		render(
			<ChatMessages messages={[makeAssistantText("Encontré 3 creadores.")]} isStreaming={false} />
		);
		expect(screen.getByText("Encontré 3 creadores.")).toBeInTheDocument();
	});

	it("shows ThinkingDots when streaming and last message is user", () => {
		const { container } = render(
			<ChatMessages messages={[makeUserMessage("¿Hola?")]} isStreaming={true} />
		);
		// ThinkingDots renders 3 bouncing dots
		const dots = container.querySelectorAll(".animate-bounce");
		expect(dots.length).toBeGreaterThanOrEqual(3);
	});

	it("does NOT show ThinkingDots when streaming ends on assistant", () => {
		const { container } = render(
			<ChatMessages
				messages={[makeUserMessage("¿Hola?"), makeAssistantText("Aquí estoy.")]}
				isStreaming={false}
			/>
		);
		// No ThinkingDots when not streaming
		const dots = container.querySelectorAll(".animate-bounce");
		expect(dots.length).toBe(0);
	});

	it("renders ToolCard with pending state (input-streaming)", () => {
		render(<ChatMessages messages={[makeToolMessage("input-streaming")]} isStreaming={true} />);
		expect(screen.getByText("Búsqueda de creadores")).toBeInTheDocument();
		// Completed label is absent when pending
		expect(screen.queryByText("✓ Completado")).not.toBeInTheDocument();
	});

	it("renders ToolCard with completed state (output-available)", () => {
		render(
			<ChatMessages
				messages={[makeToolMessage("output-available", { results: [] })]}
				isStreaming={false}
			/>
		);
		expect(screen.getByText("✓ Completado")).toBeInTheDocument();
	});

	it("renders ToolCard with error state", () => {
		render(<ChatMessages messages={[makeToolMessage("output-error")]} isStreaming={false} />);
		expect(screen.getByText("Error")).toBeInTheDocument();
	});

	it("renders creator mini-cards when output-available has results", () => {
		const output = {
			results: [
				{
					id: "c1",
					instagramHandle: "creator_one",
					fullName: "Creator One",
					city: "Medellín",
					score: "72",
				},
			],
		};
		render(
			<ChatMessages messages={[makeToolMessage("output-available", output)]} isStreaming={false} />
		);
		expect(screen.getByText("Creator One")).toBeInTheDocument();
		expect(screen.getByText("@creator_one")).toBeInTheDocument();
	});

	it("shows input params chip in tool card", () => {
		render(<ChatMessages messages={[makeToolMessage("input-available")]} isStreaming={false} />);
		// The chip contains "query: micro Medellín"
		expect(screen.getByText(/query:/)).toBeInTheDocument();
	});
});
