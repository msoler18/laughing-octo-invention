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
	engagementRate: string;       // numeric comes as string from PG
	creatorTier: CreatorTier;
	engagementQuality: EngagementQuality;
	consistencyScore: string | null;
	campaignsParticipated: number;
	tags: string[] | null;
	embeddingUpdatedAt: string | null;
	createdAt: string;
	updatedAt: string;
	score: string | null;         // from left-join creator_scores
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
export interface CreatorsFilters {
	page?: number;
	limit?: number;
	city?: string;
	tier?: CreatorTier;
	category?: string;
	engagement_quality?: EngagementQuality;
	followers_min?: number;
	followers_max?: number;
}
