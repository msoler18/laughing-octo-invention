import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type { AssignmentStatus, CampaignDetail } from "./types";

export function useCampaign(id: string) {
	return useQuery({
		queryKey: ["campaign", id],
		queryFn: () => apiClient.get<CampaignDetail>(`/api/v1/campaigns/${id}`),
	});
}

export function useUpdateAssignmentStatus(campaignId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ creatorId, status }: { creatorId: string; status: AssignmentStatus }) =>
			apiClient.patch(`/api/v1/campaigns/${campaignId}/creators/${creatorId}/status`, { status }),

		// M3-04 — optimistic update: patch assignments + recompute pipeline counters
		onMutate: async ({ creatorId, status }) => {
			await queryClient.cancelQueries({ queryKey: ["campaign", campaignId] });
			const previous = queryClient.getQueryData<CampaignDetail>(["campaign", campaignId]);

			queryClient.setQueryData<CampaignDetail>(["campaign", campaignId], (old) => {
				if (!old) return old;
				const assignments = old.assignments.map((a) =>
					a.creatorId === creatorId ? { ...a, assignmentStatus: status } : a
				);
				// Recompute pipeline counters from updated assignments
				const counters = {
					prospecto: 0,
					contactado: 0,
					confirmado: 0,
					en_brief: 0,
					contenido_enviado: 0,
					aprobado: 0,
					publicado: 0,
					verificado: 0,
					pagado: 0,
				} as Record<AssignmentStatus, number>;
				for (const a of assignments) counters[a.assignmentStatus]++;
				return { ...old, assignments, ...counters, totalAssigned: assignments.length };
			});

			return { previous };
		},

		onError: (_err, _vars, ctx) => {
			if (ctx?.previous) {
				queryClient.setQueryData(["campaign", campaignId], ctx.previous);
			}
			toast.error("Transición de estado no válida");
		},

		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
		},
	});
}

// M3-05 — campaign audit log with infinite pagination
const AUDIT_PAGE_SIZE = 20;

interface AuditEvent {
	id: string;
	action: "created" | "updated" | "status_changed" | "deleted";
	fieldName: string | null;
	oldValue: string | null;
	newValue: string | null;
	performedBy: string;
	performedAt: string;
}

interface AuditPage {
	data: AuditEvent[];
	total: number;
	page: number;
	limit: number;
}

export function useCampaignAudit(campaignId: string) {
	return useInfiniteQuery({
		queryKey: ["campaign-audit", campaignId],
		queryFn: ({ pageParam = 1 }) =>
			apiClient.get<AuditPage>(
				`/api/v1/campaigns/${campaignId}/audit?limit=${AUDIT_PAGE_SIZE}&page=${pageParam}`
			),
		initialPageParam: 1,
		getNextPageParam: (last) => {
			const loaded = (last.page - 1) * last.limit + last.data.length;
			return loaded < last.total ? last.page + 1 : undefined;
		},
	});
}

export type { AuditEvent };

export function useUpdatePostUrl(campaignId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ creatorId, postUrl }: { creatorId: string; postUrl: string }) =>
			apiClient.patch(`/api/v1/campaigns/${campaignId}/creators/${creatorId}/post-url`, {
				postUrl,
			}),

		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
			toast.success("URL del post guardada");
		},

		onError: () => toast.error("URL inválida"),
	});
}
