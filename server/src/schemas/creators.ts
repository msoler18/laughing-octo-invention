import { z } from "zod";

// ── Shared enums ────────────────────────────────────────────────────────────

const CreatorTier = z.enum(["nano", "micro", "mid", "macro", "mega"]);
const EngagementQuality = z.enum(["zero", "low", "average", "high", "viral"]);

// ── GET /api/v1/creators — query params ────────────────────────────────────

export const CreatorsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(25),
	city: z.string().optional(),
	tier: CreatorTier.optional(),
	category: z.string().optional(),   // category slug
	engagement_quality: EngagementQuality.optional(),
	followers_min: z.coerce.number().int().min(0).optional(),
	followers_max: z.coerce.number().int().min(0).optional(),
});

export type CreatorsQuery = z.infer<typeof CreatorsQuerySchema>;

// ── POST /api/v1/creators — request body ───────────────────────────────────

export const CreateCreatorSchema = z.object({
	instagramHandle: z.string().min(1).max(255),
	fullName: z.string().min(1).max(255),
	phone: z.string().max(50).optional(),
	email: z.string().email().optional(),
	country: z.string().max(100).optional(),
	city: z.string().max(100).optional(),

	followersCount: z.number().int().min(0).default(0),
	engagementRate: z.number().min(0).max(100).default(0),
	avgLikesLast10: z.number().min(0).optional(),
	reachRate: z.number().min(0).max(100).optional(),

	creatorTier: CreatorTier.default("nano"),
	engagementQuality: EngagementQuality.default("zero"),

	consistencyScore: z.number().min(0).max(100).optional(),
	audienceQualityScore: z.number().min(0).max(100).optional(),

	bioText: z.string().optional(),
	contentLanguage: z.string().max(10).optional(),
	dominantFormat: z.enum(["Reels", "carousel", "photo"]).optional(),
	tiktokHandle: z.string().max(255).optional(),
	brandMentionsLast30Posts: z.number().int().min(0).default(0),
	bioKeywords: z.array(z.string()).optional(),

	contentRateUsd: z.number().min(0).optional(),
	paymentMethod: z.string().max(100).optional(),
	onboardingStatus: z.string().max(100).optional(),
	notes: z.string().optional(),
	tags: z.array(z.string()).default([]),
	gdprConsentAt: z.string().datetime({ offset: true }).optional(),
});

export type CreateCreatorBody = z.infer<typeof CreateCreatorSchema>;

// ── PUT /api/v1/creators/:id — request body (all fields optional) ──────────

export const UpdateCreatorSchema = CreateCreatorSchema.partial();
export type UpdateCreatorBody = z.infer<typeof UpdateCreatorSchema>;

// ── Fields that require re-vectorization when changed ─────────────────────
// Any update touching these fields will set embedding_updated_at = NULL,
// queuing the creator for the next pg_cron embedding cycle.

export const EMBEDDING_INVALIDATING_FIELDS = new Set<keyof UpdateCreatorBody>([
	"fullName",
	"bioText",
	"city",
	"creatorTier",
	"engagementQuality",
	"bioKeywords",
	"dominantFormat",
	"contentLanguage",
]);
