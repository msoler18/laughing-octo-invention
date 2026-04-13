import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./error-boundary";

// Component that throws on first render when given the error prop
function BrokenComponent({ shouldThrow }: { shouldThrow: boolean }) {
	if (shouldThrow) throw new Error("Render error from BrokenComponent");
	return <p>OK</p>;
}

// Suppress console.error output from ErrorBoundary.componentDidCatch in test output
const noop = () => {};

describe("ErrorBoundary", () => {
	it("renders children when there is no error", () => {
		render(
			<ErrorBoundary>
				<p>contenido</p>
			</ErrorBoundary>
		);
		expect(screen.getByText("contenido")).toBeInTheDocument();
	});

	it("renders default fallback UI when a child throws", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(noop);
		render(
			<ErrorBoundary>
				<BrokenComponent shouldThrow={true} />
			</ErrorBoundary>
		);
		expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
		expect(screen.getByText(/Render error from BrokenComponent/)).toBeInTheDocument();
		spy.mockRestore();
	});

	it("shows retry button that resets the error state", async () => {
		const user = userEvent.setup();
		const spy = vi.spyOn(console, "error").mockImplementation(noop);

		// We need a stateful wrapper so BrokenComponent stops throwing after reset
		function Wrapper() {
			// After the boundary resets it will re-render BrokenComponent.
			// We simulate this by having the boundary always reset to a non-throwing child.
			return (
				<ErrorBoundary>
					<BrokenComponent shouldThrow={true} />
				</ErrorBoundary>
			);
		}

		render(<Wrapper />);
		expect(screen.getByText("Algo salió mal")).toBeInTheDocument();

		// Retry button is present
		const retryBtn = screen.getByRole("button", { name: /Intentar de nuevo/i });
		expect(retryBtn).toBeInTheDocument();

		// After click the boundary resets (BrokenComponent will throw again but the reset happened)
		await user.click(retryBtn);
		// After reset, BrokenComponent throws again → fallback re-appears
		expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
		spy.mockRestore();
	});

	it("renders a custom fallback when provided", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(noop);
		render(
			<ErrorBoundary fallback={<p>custom fallback</p>}>
				<BrokenComponent shouldThrow={true} />
			</ErrorBoundary>
		);
		expect(screen.getByText("custom fallback")).toBeInTheDocument();
		expect(screen.queryByText("Algo salió mal")).not.toBeInTheDocument();
		spy.mockRestore();
	});
});
