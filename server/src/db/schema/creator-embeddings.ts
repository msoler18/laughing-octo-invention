import { customType, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { creators } from "./creators.js";

// pgvector custom type — stored as vector(512) in PostgreSQL.
// Dimensions fixed at 512 to match text-embedding-3-small output
// as configured in ADR-002 (cost vs quality trade-off).
const vector = customType<{
	data: number[];
	driverData: string;
	config: { dimensions: number };
}>({
	dataType(config) {
		return `vector(${config?.dimensions ?? 1536})`;
	},
	fromDriver(value: string): number[] {
		// pgvector returns "[0.1,0.2,...]" string format
		return value
			.slice(1, -1)
			.split(",")
			.map(Number);
	},
	toDriver(value: number[]): string {
		return `[${value.join(",")}]`;
	},
});

export const creatorEmbeddings = pgTable("creator_embeddings", {
	id: uuid("id").defaultRandom().primaryKey(),
	creatorId: uuid("creator_id")
		.notNull()
		.unique()
		.references(() => creators.id, { onDelete: "cascade" }),

	// 512-dimensional vector (text-embedding-3-small)
	// HNSW index defined in migration SQL (M0-15)
	embedding: vector("embedding", { dimensions: 512 }).notNull(),

	// The composed text passed to the embedding model — stored for auditability.
	// Privacy: phone and email are structurally excluded (TypeScript Omit + this field).
	sourceText: text("source_text").notNull(),

	// Track which model generated this vector to detect stale embeddings
	// after model upgrades.
	modelId: text("model_id").notNull().default("text-embedding-3-small"),

	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type CreatorEmbedding = typeof creatorEmbeddings.$inferSelect;
export type NewCreatorEmbedding = typeof creatorEmbeddings.$inferInsert;
