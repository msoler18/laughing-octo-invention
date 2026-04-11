import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

		// Optimistic update
		onMutate: async ({ creatorId, status }) => {
			await queryClient.cancelQueries({ queryKey: ["campaign", campaignId] });
			const previous = queryClient.getQueryData<CampaignDetail>(["campaign", campaignId]);

			queryClient.setQueryData<CampaignDetail>(["campaign", campaignId], (old) => {
				if (!old) return old;
				return {
					...old,
					assignments: old.assignments.map((a) =>
						a.creatorId === creatorId ? { ...a, assignmentStatus: status } : a
					),
				};
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
