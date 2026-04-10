import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { auditActionEnum, auditEntityTypeEnum } from "./enums.js";

// Immutable audit log — no UPDATE or DELETE allowed (enforced via RLS + trigger).
// Every state change or data modification writes a row here atomically
// within the same Drizzle transaction.
export const auditLog = pgTable("audit_log", {
	id: uuid("id").defaultRandom().primaryKey(),
	entityType: auditEntityTypeEnum("entity_type").notNull(),
	entityId: uuid("entity_id").notNull(),
	action: auditActionEnum("action").notNull(),
	// NULL on creation or deletion (no single field changed)
	fieldName: text("field_name"),
	oldValue: text("old_value"),
	newValue: text("new_value"),
	performedBy: text("performed_by").notNull(),
	performedAt: timestamp("performed_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	// Optional metadata: IP, user agent, session id
	sessionContext: jsonb("session_context").$type<Record<string, unknown>>(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
