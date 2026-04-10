"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
	{ href: "/creators",  label: "Creadores",  icon: Users },
	{ href: "/campaigns", label: "Campañas",   icon: LayoutGrid },
] as const;

export function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-bg-surface border-r border-border-default">
			{/* Logo / brand */}
			<div className="flex h-14 shrink-0 items-center gap-2.5 px-5 border-b border-border-default">
				<span className="h-6 w-6 rounded-md bg-blue-400 flex items-center justify-center">
					<span className="text-white text-xs font-bold leading-none">R</span>
				</span>
				<span className="text-sm font-semibold text-text-primary tracking-tight">RealUp</span>
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
				{NAV_ITEMS.map(({ href, label, icon: Icon }) => {
					const active = pathname === href || pathname.startsWith(`${href}/`);
					return (
						<Link
							key={href}
							href={href}
							className={cn(
								"flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
								active
									? "bg-blue-400/10 text-blue-300 font-medium"
									: "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
							)}
						>
							<Icon
								size={16}
								className={cn(active ? "text-blue-400" : "text-text-tertiary")}
							/>
							{label}
						</Link>
					);
				})}
			</nav>

			{/* Footer */}
			<div className="shrink-0 px-5 py-4 border-t border-border-default">
				<p className="text-xs text-text-tertiary font-mono">v0.1.0 · MVP</p>
			</div>
		</aside>
	);
}
