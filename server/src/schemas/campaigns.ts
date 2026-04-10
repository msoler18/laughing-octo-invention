import { z } from "zod";

// ── POST /api/v1/campaigns — request body ──────────────────────────────────

export const CreateCampaignSchema = z
	.object({
		name: z.string().min(1).max(255),
		brand: z.string().min(1).max(255),
		description: z.string().optional(),
		briefText: z.string().optional(),
		startDate: z.string().datetime({ offset: true }).optional(),
		endDate: z.string().datetime({ offset: true }).optional(),
		targetCreatorCount: z.number().int().min(0).default(0),
	})
	.refine(
		(d) => {
			if (d.startDate && d.endDate) {
				return new Date(d.startDate) < new Date(d.endDate);
			}
			return true;
		},
		{ message: "endDate must be after startDate", path: ["endDate"] },
	);

export type CreateCampaignBody = z.infer<typeof CreateCampaignSchema>;

// ── PUT /api/v1/campaigns/:id — request body ───────────────────────────────

const UpdateCampaignBase = z.object({
	name: z.string().min(1).max(255).optional(),
	brand: z.string().min(1).max(255).optional(),
	description: z.string().optional(),
	briefText: z.string().optional(),
	startDate: z.string().datetime({ offset: true }).optional(),
	endDate: z.string().datetime({ offset: true }).optional(),
	targetCreatorCount: z.number().int().min(0).optional(),
});

export const UpdateCampaignSchema = UpdateCampaignBase.refine(
	(d) => {
		if (d.startDate && d.endDate) {
			return new Date(d.startDate) < new Date(d.endDate);
		}
		return true;
	},
	{ message: "endDate must be after startDate", path: ["endDate"] },
);

export type UpdateCampaignBody = z.infer<typeof UpdateCampaignSchema>;

// ── POST /api/v1/campaigns/:id/creators — request body ────────────────────

export const BulkAssignSchema = z.object({
	creatorIds: z.array(z.string().uuid()).min(1).max(500),
});

export type BulkAssignBody = z.infer<typeof BulkAssignSchema>;

// ── Pipeline stat keys (9 assignment statuses) ─────────────────────────────

export const ASSIGNMENT_STATUSES = [
	"prospecto",
	"contactado",
	"confirmado",
	"en_brief",
	"contenido_enviado",
	"aprobado",
	"publicado",
	"verificado",
	"pagado",
] as const;
