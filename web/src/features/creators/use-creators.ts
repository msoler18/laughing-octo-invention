import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreatorsFilters, CreatorsListResponse } from "./types";

function buildQS(filters: CreatorsFilters): string {
	const params = new URLSearchParams();
	for (const [k, v] of Object.entries(filters)) {
		if (v !== undefined && v !== "" && v !== null) {
			params.set(k, String(v));
		}
	}
	const qs = params.toString();
	return qs ? `?${qs}` : "";
}

export function useCreators(filters: CreatorsFilters) {
	return useQuery({
		queryKey: ["creators", filters],
		queryFn: () =>
			apiClient.get<CreatorsListResponse>(`/api/v1/creators${buildQS(filters)}`),
	});
}
