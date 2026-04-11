export type CampaignStatus = "draft" | "active" | "closed";
export type AssignmentStatus =
	| "prospecto" | "contactado" | "confirmado" | "en_brief"
	| "contenido_enviado" | "aprobado" | "publicado" | "verificado" | "pagado";

export const ASSIGNMENT_STATUSES: AssignmentStatus[] = [
	"prospecto", "contactado", "confirmado", "en_brief",
	"contenido_enviado", "aprobado", "publicado", "verificado", "pagado",
];

export interface PipelineStats {
	totalAssigned: number;
	prospecto: number;
	contactado: number;
	confirmado: number;
	en_brief: number;
	contenido_enviado: number;
	aprobado: number;
	publicado: number;
	verificado: number;
	pagado: number;
}

export interface CampaignRow extends PipelineStats {
	id: string;
	name: string;
	brand: string;
	description: string | null;
	startDate: string | null;
	endDate: string | null;
	status: CampaignStatus;
	targetCreatorCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface Assignment {
	id: string;
	creatorId: string;
	instagramHandle: string;
	fullName: string;
	followersCount: number;
	creatorTier: string;
	assignmentStatus: AssignmentStatus;
	postUrl: string | null;
	notes: string | null;
	statusUpdatedAt: string;
	assignedAt: string;
	confirmedAt: string | null;
	publishedAt: string | null;
	verifiedAt: string | null;
	paidAt: string | null;
	impressions: number | null;
	reach: number | null;
	saves: number | null;
	likes: number | null;
	comments: number | null;
	metricsEnteredBy: string | null;
	metricsEnteredAt: string | null;
	score: string | null;
}

export interface CampaignDetail extends CampaignRow {
	briefText: string | null;
	assignments: Assignment[];
}
