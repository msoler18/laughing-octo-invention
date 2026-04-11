import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ImportJob {
	id: string;
	filename: string;
	status: "queued" | "processing" | "done" | "failed";
	rowsProcessed: number;
	rowsSkipped: number;
	errorLog: Array<{ row: number; error: string }>;
	createdAt: string;
	completedAt: string | null;
}

export function useImportJob(jobId: string | null) {
	return useQuery({
		queryKey: ["import-job", jobId],
		queryFn: () => apiClient.get<ImportJob>(`/api/v1/import/${jobId}`),
		enabled: jobId !== null,
		// Poll every 2s while the job is in progress
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			return status === "done" || status === "failed" ? false : 2000;
		},
	});
}
