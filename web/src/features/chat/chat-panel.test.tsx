import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server } from "@/mocks/node";
import { ChatPanel } from "./chat-panel";

// MSW intercepts the /api/v1/chat fetch made by useChat
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("ChatPanel", () => {
	it("renders the floating toggle button when closed", () => {
		render(<ChatPanel />);
		expect(screen.getByTitle(/Abrir asistente IA/)).toBeInTheDocument();
	});

	it("opens the panel when the toggle button is clicked", async () => {
		const user = userEvent.setup();
		render(<ChatPanel />);
		await user.click(screen.getByTitle(/Abrir asistente IA/));
		expect(screen.getByText("Asistente RealUp")).toBeInTheDocument();
	});

	it("closes the panel with the X button", async () => {
		const user = userEvent.setup();
		render(<ChatPanel />);
		// Open
		await user.click(screen.getByTitle(/Abrir asistente IA/));
		expect(screen.getByText("Asistente RealUp")).toBeInTheDocument();
		// Close via aria-label
		await user.click(screen.getByRole("button", { name: /Cerrar asistente/i }));
		expect(screen.queryByText("Asistente RealUp")).not.toBeInTheDocument();
	});

	it("shows the empty-state prompt when no messages", async () => {
		const user = userEvent.setup();
		render(<ChatPanel />);
		await user.click(screen.getByTitle(/Abrir asistente IA/));
		expect(screen.getByText("¿En qué te ayudo?")).toBeInTheDocument();
	});

	it("shows all 5 example queries", async () => {
		const user = userEvent.setup();
		render(<ChatPanel />);
		await user.click(screen.getByTitle(/Abrir asistente IA/));
		expect(
			screen.getByText("Busca creadores micro de Medellín con engagement viral")
		).toBeInTheDocument();
		expect(
			screen.getByText("¿Quiénes aún no han publicado en la campaña actual?")
		).toBeInTheDocument();
		expect(
			screen.getByText("Muéstrame creadores similares a uno que ya tengo")
		).toBeInTheDocument();
		expect(screen.getByText("Creadores con más de 50K seguidores en Bogotá")).toBeInTheDocument();
		expect(screen.getByText("¿Cuántos están en etapa de brief?")).toBeInTheDocument();
	});

	it("clicking an example query fills the textarea", async () => {
		const user = userEvent.setup();
		render(<ChatPanel />);
		await user.click(screen.getByTitle(/Abrir asistente IA/));
		const query = "Creadores con más de 50K seguidores en Bogotá";
		await user.click(screen.getByText(query));
		const textarea = screen.getByPlaceholderText(/Escribe tu consulta/);
		expect(textarea).toHaveValue(query);
	});

	it("opens the panel on Cmd+/ keyboard shortcut", async () => {
		const user = userEvent.setup();
		render(<ChatPanel />);
		await user.keyboard("{Meta>}/{/Meta}");
		expect(screen.getByText("Asistente RealUp")).toBeInTheDocument();
	});

	it("closes the panel on second Cmd+/ press", async () => {
		const user = userEvent.setup();
		render(<ChatPanel />);
		await user.keyboard("{Meta>}/{/Meta}");
		expect(screen.getByText("Asistente RealUp")).toBeInTheDocument();
		await user.keyboard("{Meta>}/{/Meta}");
		expect(screen.queryByText("Asistente RealUp")).not.toBeInTheDocument();
	});
});
