export type CreatorTier = "nano" | "micro" | "mid" | "macro" | "mega";
export type EngagementQuality = "zero" | "low" | "average" | "high" | "viral";

/** Shape returned by GET /api/v1/creators (list row) */
export interface CreatorRow {
	id: string;
	instagramHandle: string;
	fullName: string;
	country: string | null;
	city: string | null;
	followersCount: number;
	engagementRate: string; // numeric comes as string from PG
	creatorTier: CreatorTier;
	engagementQuality: EngagementQuality;
	consistencyScore: string | null;
	campaignsParticipated: number;
	tags: string[] | null;
	embeddingUpdatedAt: string | null;
	createdAt: string;
	updatedAt: string;
	score: string | null; // from left-join creator_scores
}

export interface Pagination {
	page: number;
	limit: number;
	total: number;
	pages: number;
}

export interface CreatorsListResponse {
	data: CreatorRow[];
	pagination: Pagination;
}

/** Query params accepted by GET /api/v1/creators */
/** Full creator returned by GET /api/v1/creators/:id */
export interface CreatorDetail extends CreatorRow {
	phone: string | null;
	email: string | null;
	avgLikesLast10: string | null;
	reachRate: string | null;
	audienceQualityScore: string | null;
	bioText: string | null;
	contentLanguage: string | null;
	dominantFormat: string | null;
	tiktokHandle: string | null;
	brandMentionsLast30Posts: number;
	bioKeywords: string[] | null;
	contentRateUsd: string | null;
	paymentMethod: string | null;
	onboardingStatus: string | null;
	notes: string | null;
	gdprConsentAt: string | null;
	dataQualityFlags: Record<string, unknown>;
	peakActivityHours: number[] | null;
	// Score breakdown
	engagementWeight: string | null;
	tierWeight: string | null;
	consistencyWeight: string | null;
	campaignHistoryWeight: string | null;
	scoreCalculatedAt: string | null;
	scoreVersion: number | null;
	// Embedding
	vectorized: boolean;
	embeddingModelId: string | null;
}

// ── RAG Search ────────────────────────────────────────────────────────────────

export interface SearchResult {
	id: string;
	instagramHandle: string;
	fullName: string;
	city: string | null;
	creatorTier: string;
	engagementQuality: string;
	followersCount: number;
	engagementRate: string;
	bioText: string | null;
	bioKeywords: string[] | null;
	score: string | null;
	semanticScore: number; // 0–1, higher = more relevant
}

export interface AppliedFilters {
	city?: string;
	tier?: string;
	followers_min?: number;
	followers_max?: number;
	engagement_quality?: string;
	category_slugs?: string[];
}

export interface SearchResponse {
	results: SearchResult[];
	filtersApplied: AppliedFilters;
	total: number;
	embeddingsPending: number;
}

export interface CreatorsFilters {
	page?: number;
	limit?: number;
	city?: string;
	tier?: CreatorTier;
	category?: string;
	engagement_quality?: EngagementQuality;
	followers_min?: number;
	followers_max?: number;
	sort_by?: "score" | "followers" | "created_at";
	sort_order?: "asc" | "desc";
}
