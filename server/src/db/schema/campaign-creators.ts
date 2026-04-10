import {
	integer,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { campaigns } from "./campaigns.js";
import { creators } from "./creators.js";
import { assignmentStatusEnum } from "./enums.js";

export const campaignCreators = pgTable("campaign_creators", {
	id: uuid("id").defaultRandom().primaryKey(),

	// ── Foreign keys ──────────────────────────────────────────────────────────
	campaignId: uuid("campaign_id")
		.notNull()
		.references(() => campaigns.id, { onDelete: "cascade" }),
	creatorId: uuid("creator_id")
		.notNull()
		.references(() => creators.id, { onDelete: "cascade" }),

	// ── Assignment lifecycle ───────────────────────────────────────────────────
	assignmentStatus: assignmentStatusEnum("assignment_status")
		.notNull()
		.default("prospecto"),

	// ── Content delivery ──────────────────────────────────────────────────────
	// Required before moving to "publicado"
	postUrl: text("post_url"),
	notes: text("notes"),

	// ── Status timestamps (set when each state is entered) ────────────────────
	statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	assignedAt: timestamp("assigned_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
	publishedAt: timestamp("published_at", { withTimezone: true }),
	verifiedAt: timestamp("verified_at", { withTimezone: true }),
	paidAt: timestamp("paid_at", { withTimezone: true }),

	// ── Post performance metrics (manual entry in MVP) ────────────────────────
	impressions: integer("impressions"),
	reach: integer("reach"),
	saves: integer("saves"),
	likes: integer("likes"),
	comments: integer("comments"),
	metricsEnteredBy: text("metrics_entered_by"),
	metricsEnteredAt: timestamp("metrics_entered_at", { withTimezone: true }),
});

export type CampaignCreator = typeof campaignCreators.$inferSelect;
export type NewCampaignCreator = typeof campaignCreators.$inferInsert;
