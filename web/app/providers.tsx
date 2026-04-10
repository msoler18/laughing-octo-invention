"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
	// One QueryClient per session — stable across re-renders via useState
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime:          60 * 1000,  // 1 min
						retry:              1,
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<TooltipProvider delayDuration={300}>{children}</TooltipProvider>
		</QueryClientProvider>
	);
}
