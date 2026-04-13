"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	message: string;
}

/**
 * ErrorBoundary — catches render errors in the subtree and shows a recovery UI.
 * Wrap feature areas (pages, large panels) that could throw unexpectedly.
 */
export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, message: "" };
	}

	static getDerivedStateFromError(error: unknown): State {
		const message = error instanceof Error ? error.message : "Error inesperado en la aplicación.";
		return { hasError: true, message };
	}

	componentDidCatch(error: unknown, info: ErrorInfo) {
		// biome-ignore lint/suspicious/noConsole: error boundary intentionally logs to console
		console.error("[ErrorBoundary]", error, info.componentStack);
	}

	reset = () => this.setState({ hasError: false, message: "" });

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) return this.props.fallback;

			return (
				<div className="flex flex-col items-center justify-center min-h-[200px] py-16 text-center px-4">
					<p className="text-sm font-medium text-text-primary">Algo salió mal</p>
					<p className="mt-1 text-xs text-text-tertiary max-w-xs">{this.state.message}</p>
					<Button variant="secondary" size="sm" className="mt-4" onClick={this.reset}>
						Intentar de nuevo
					</Button>
				</div>
			);
		}

		return this.props.children;
	}
}
