import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatPanel } from "@/features/chat/chat-panel";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "RealUp — Gestión de Campañas",
	description: "Herramienta interna de gestión de campañas de Crowdposting",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
			<body className="h-full bg-bg-page text-text-primary">
				<Providers>
					{/* Fixed sidebar — 240px */}
					<Sidebar />

					{/* Main content area — offset by sidebar width */}
					<div className="pl-60 flex flex-col min-h-full">
						{/* M7-08 — ErrorBoundary wraps all page content */}
						<ErrorBoundary>{children}</ErrorBoundary>
					</div>

					{/* M6-07 — AI Chat panel (global, Cmd+/ to toggle) */}
					<ChatPanel />
				</Providers>
				<Toaster
					theme="dark"
					position="bottom-right"
					toastOptions={{
						className: "!bg-bg-elevated !text-text-primary !ring-1 !ring-border-default",
					}}
				/>
			</body>
		</html>
	);
}
