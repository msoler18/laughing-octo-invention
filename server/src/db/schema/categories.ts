import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { creators } from "./creators.js";

// Two-level taxonomy: category + subcategory.
// Seeded with 7 base categories in migration SQL.
export const categories = pgTable("categories", {
	id: uuid("id").defaultRandom().primaryKey(),
	slug: text("slug").notNull().unique(),     // "lifestyle", "fitness"
	name: text("name").notNull(),              // "Estilo de vida", "Fitness"
	parentSlug: text("parent_slug"),           // NULL for top-level
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

// M:N pivot between creators and categories.
// is_primary flags the creator's main category (used in embeddings).
export const creatorCategories = pgTable("creator_categories", {
	id: uuid("id").defaultRandom().primaryKey(),
	creatorId: uuid("creator_id")
		.notNull()
		.references(() => creators.id, { onDelete: "cascade" }),
	categorySlug: text("category_slug")
		.notNull()
		.references(() => categories.slug, { onDelete: "cascade" }),
	isPrimary: boolean("is_primary").notNull().default(false),
	// Optional free-text subnicho beyond the two-level taxonomy
	subniche: text("subniche"),
});

export type Category = typeof categories.$inferSelect;
export type CreatorCategory = typeof creatorCategories.$inferSelect;
