import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { AppliedFilters, SearchResponse } from "./types";

async function fetchSearch(query: string, filters: AppliedFilters): Promise<SearchResponse> {
	return apiClient.post<SearchResponse>("/api/v1/search", { query, filters, limit: 20 });
}

export function useRAGSearch() {
	// The query text currently in the input
	const [inputValue, setInputValue] = useState("");
	// The last submitted query (triggers the fetch)
	const [submittedQuery, setSubmittedQuery] = useState("");
	// Filters explicitly passed to override LLM extraction (used for chip removal, M4-08)
	const [activeFilters, setActiveFilters] = useState<AppliedFilters>({});
	// Track which filter keys the user has manually removed
	const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());

	const isActive = submittedQuery.length > 0;

	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["rag-search", submittedQuery, activeFilters],
		queryFn: () => fetchSearch(submittedQuery, activeFilters),
		enabled: isActive,
		staleTime: 30_000,
	});

	function search(query: string) {
		const trimmed = query.trim();
		if (!trimmed) return;
		setRemovedKeys(new Set());
		setActiveFilters({});
		setSubmittedQuery(trimmed);
		setInputValue(trimmed);
	}

	// M4-08 — remove a chip: exclude that key from filters and re-search
	function removeFilter(key: keyof AppliedFilters) {
		const next = { ...(data?.filtersApplied ?? {}) };
		delete next[key];
		// Also exclude keys the user has already removed in this session
		const newRemoved = new Set([...removedKeys, key]);
		for (const k of newRemoved) delete next[k as keyof AppliedFilters];
		setRemovedKeys(newRemoved);
		setActiveFilters(next);
	}

	function clear() {
		setSubmittedQuery("");
		setInputValue("");
		setActiveFilters({});
		setRemovedKeys(new Set());
	}

	// Chips shown = filtersApplied from latest response, minus manually removed keys
	const chips = Object.entries(data?.filtersApplied ?? {})
		.filter(([k, v]) => v !== undefined && v !== null && !removedKeys.has(k))
		.map(([key, value]) => ({ key: key as keyof AppliedFilters, value }));

	return {
		inputValue,
		setInputValue,
		isActive,
		search,
		clear,
		removeFilter,
		chips,
		results: data?.results ?? [],
		total: data?.total ?? 0,
		embeddingsPending: data?.embeddingsPending ?? 0,
		isLoading: isLoading && isActive,
		isFetching,
	};
}
