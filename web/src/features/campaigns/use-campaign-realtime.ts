"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase-client";

/** Subscribes to campaign_creators changes for the given campaign via
 *  Supabase Realtime. On any INSERT/UPDATE/DELETE, invalidates the
 *  TanStack Query cache so the detail view refreshes automatically.
 *
 *  Gracefully no-ops when NEXT_PUBLIC_SUPABASE_URL is not set. */
export function useCampaignRealtime(campaignId: string) {
	const queryClient = useQueryClient();

	useEffect(() => {
		const supabase = getSupabaseClient();
		if (!supabase) return; // no credentials in dev → skip

		const channel = supabase
			.channel(`campaign_creators_${campaignId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "campaign_creators",
					filter: `campaign_id=eq.${campaignId}`,
				},
				() => {
					queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [campaignId, queryClient]);
}
