import { integer, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { creators } from "./creators.js";

export const creatorScores = pgTable("creator_scores", {
	id: uuid("id").defaultRandom().primaryKey(),
	creatorId: uuid("creator_id")
		.notNull()
		.unique()
		.references(() => creators.id, { onDelete: "cascade" }),

	// Final weighted score 0–100
	score: numeric("score", { precision: 5, scale: 2 }).notNull().default("0"),

	// Individual weight contributions (sum = score)
	// engagement_quality → 0–40 pts
	engagementWeight: numeric("engagement_weight", { precision: 5, scale: 2 })
		.notNull()
		.default("0"),
	// creator_tier → 0–30 pts
	tierWeight: numeric("tier_weight", { precision: 5, scale: 2 })
		.notNull()
		.default("0"),
	// consistency_score → 0–20 pts
	consistencyWeight: numeric("consistency_weight", { precision: 5, scale: 2 })
		.notNull()
		.default("0"),
	// campaigns_participated → 0–10 pts
	campaignHistoryWeight: numeric("campaign_history_weight", {
		precision: 5,
		scale: 2,
	})
		.notNull()
		.default("0"),

	calculatedAt: timestamp("calculated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	// Increment when formula changes — allows comparing scores across versions
	scoreVersion: integer("score_version").notNull().default(1),
});

export type CreatorScore = typeof creatorScores.$inferSelect;
export type NewCreatorScore = typeof creatorScores.$inferInsert;
