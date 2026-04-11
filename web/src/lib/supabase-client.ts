import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | null = null;

/** Returns a lazy-initialized Supabase browser client.
 *  Returns null if env vars are missing (dev without Supabase). */
export function getSupabaseClient() {
	if (client) return client;

	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !key) return null;

	client = createClient(url, key, {
		realtime: { params: { eventsPerSecond: 10 } },
	});

	return client;
}
