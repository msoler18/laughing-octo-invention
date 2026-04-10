import {
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { campaignStatusEnum } from "./enums.js";

export const campaigns = pgTable("campaigns", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	brand: text("brand").notNull(),
	description: text("description"),
	briefText: text("brief_text"),
	startDate: timestamp("start_date", { withTimezone: true }),
	endDate: timestamp("end_date", { withTimezone: true }),
	status: campaignStatusEnum("status").notNull().default("draft"),
	targetCreatorCount: integer("target_creator_count").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
