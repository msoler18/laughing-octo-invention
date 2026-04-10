import {
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { creatorTierEnum, engagementQualityEnum } from "./enums.js";

export const creators = pgTable("creators", {
	id: uuid("id").defaultRandom().primaryKey(),

	// ── Identity ──────────────────────────────────────────────────────────────
	instagramHandle: text("instagram_handle").notNull().unique(),
	fullName: text("full_name").notNull(),
	phone: text("phone"),  // stored as text — never as number
	email: text("email"),
	country: text("country"),
	city: text("city"),

	// ── Reach metrics ─────────────────────────────────────────────────────────
	followersCount: integer("followers_count").notNull().default(0),
	engagementRate: numeric("engagement_rate", { precision: 5, scale: 2 })
		.notNull()
		.default("0"),
	avgLikesLast10: numeric("avg_likes_last_10", { precision: 10, scale: 2 }),
	reachRate: numeric("reach_rate", { precision: 5, scale: 2 }),

	// ── Calculated fields (derived from followers/engagement) ─────────────────
	creatorTier: creatorTierEnum("creator_tier").notNull().default("nano"),
	engagementQuality: engagementQualityEnum("engagement_quality")
		.notNull()
		.default("zero"),

	// ── Quality signals ───────────────────────────────────────────────────────
	consistencyScore: numeric("consistency_score", { precision: 5, scale: 2 }),
	audienceQualityScore: numeric("audience_quality_score", {
		precision: 5,
		scale: 2,
	}),
	// Flexible JSONB for ingestion errors without blocking record creation
	dataQualityFlags: jsonb("data_quality_flags").$type<Record<string, unknown>>().default({}),

	// ── Creator context ───────────────────────────────────────────────────────
	bioText: text("bio_text"),
	contentLanguage: text("content_language"),
	dominantFormat: text("dominant_format"), // Reels | carousel | photo
	peakActivityHours: jsonb("peak_activity_hours").$type<number[]>(),
	tiktokHandle: text("tiktok_handle"),
	brandMentionsLast30Posts: integer("brand_mentions_last_30_posts").default(0),
	bioKeywords: text("bio_keywords").array(),

	// ── Commercial fields (nullable from MVP) ─────────────────────────────────
	contentRateUsd: numeric("content_rate_usd", { precision: 10, scale: 2 }),
	paymentMethod: text("payment_method"),
	onboardingStatus: text("onboarding_status"),
	campaignsParticipated: integer("campaigns_participated")
		.notNull()
		.default(0),
	notes: text("notes"),
	tags: text("tags").array().default([]),
	gdprConsentAt: timestamp("gdpr_consent_at", { withTimezone: true }),

	// ── Vectorization (RAG) ───────────────────────────────────────────────────
	// NULL → creator not yet vectorized; pipeline picks these up every 5 min
	embeddingUpdatedAt: timestamp("embedding_updated_at", {
		withTimezone: true,
	}),

	// ── Timestamps ────────────────────────────────────────────────────────────
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type Creator = typeof creators.$inferSelect;
export type NewCreator = typeof creators.$inferInsert;
