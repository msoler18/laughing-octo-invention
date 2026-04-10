import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { importJobStatusEnum } from "./enums.js";

export const importJobs = pgTable("import_jobs", {
	id: uuid("id").defaultRandom().primaryKey(),
	filename: text("filename").notNull(),
	status: importJobStatusEnum("status").notNull().default("queued"),

	// Row-level results populated by the import worker on completion
	rowsProcessed: integer("rows_processed").default(0),
	rowsSkipped: integer("rows_skipped").default(0),
	// Array of { row, error } objects for failed rows
	errorLog: jsonb("error_log").$type<Array<{ row: number; error: string }>>().default([]),

	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type ImportJob = typeof importJobs.$inferSelect;
export type NewImportJob = typeof importJobs.$inferInsert;
