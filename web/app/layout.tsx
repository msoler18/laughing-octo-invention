import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
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
		<html
			lang="es"
			className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
		>
			<body className="h-full bg-bg-page text-text-primary">
				<Providers>
					{/* Fixed sidebar — 240px */}
					<Sidebar />

					{/* Main content area — offset by sidebar width */}
					<div className="pl-60 flex flex-col min-h-full">
						{children}
					</div>
				</Providers>
			</body>
		</html>
	);
}
