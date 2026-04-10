import { pgEnum } from "drizzle-orm/pg-core";

// ─── Creator enums ────────────────────────────────────────────────────────────

export const creatorTierEnum = pgEnum("creator_tier", [
	"nano",   // < 10K followers
	"micro",  // 10K – 50K
	"mid",    // 50K – 100K
	"macro",  // 100K – 500K
	"mega",   // > 500K
]);

export const engagementQualityEnum = pgEnum("engagement_quality", [
	"zero",
	"low",
	"average",
	"high",
	"viral",
]);

// ─── Campaign enums ───────────────────────────────────────────────────────────

export const campaignStatusEnum = pgEnum("campaign_status", [
	"draft",
	"active",
	"closed",
]);

// ─── Assignment lifecycle — 9 states ─────────────────────────────────────────

export const assignmentStatusEnum = pgEnum("assignment_status", [
	"prospecto",
	"contactado",
	"confirmado",
	"en_brief",
	"contenido_enviado",
	"aprobado",
	"publicado",
	"verificado",
	"pagado",
]);

// ─── Audit log enums ──────────────────────────────────────────────────────────

export const auditEntityTypeEnum = pgEnum("audit_entity_type", [
	"creator",
	"campaign",
	"campaign_creator",
]);

export const auditActionEnum = pgEnum("audit_action", [
	"created",
	"updated",
	"status_changed",
	"deleted",
]);

// ─── Import job enum ──────────────────────────────────────────────────────────

export const importJobStatusEnum = pgEnum("import_job_status", [
	"queued",
	"processing",
	"done",
	"failed",
]);
