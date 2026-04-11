"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCampaignAudit } from "./use-campaign";

const ACTION_LABELS: Record<string, string> = {
	created: "Creado",
	updated: "Actualizado",
	status_changed: "Estado cambiado",
	deleted: "Eliminado",
};

export function CampaignAuditFeed({ campaignId }: { campaignId: string }) {
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		useCampaignAudit(campaignId);

	const events = data?.pages.flatMap((p) => p.data) ?? [];

	if (isLoading) {
		return (
			<div className="flex justify-center py-6">
				<Loader2 size={16} className="animate-spin text-text-tertiary" />
			</div>
		);
	}

	if (events.length === 0) {
		return <p className="text-xs text-text-tertiary py-4 text-center">Sin historial de cambios.</p>;
	}

	return (
		<div className="space-y-4">
			<ol className="space-y-3">
				{events.map((e) => (
					<li key={e.id} className="flex gap-3 text-xs">
						<span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-border-default ring-2 ring-bg-page" />
						<div className="flex-1 min-w-0">
							<div className="flex items-baseline justify-between gap-2">
								<span className="font-medium text-text-primary">
									{ACTION_LABELS[e.action] ?? e.action}
									{e.fieldName && (
										<span className="ml-1 font-mono text-text-tertiary">{e.fieldName}</span>
									)}
								</span>
								<time
									dateTime={e.performedAt}
									className="shrink-0 text-text-tertiary"
									title={new Date(e.performedAt).toLocaleString("es-CO")}
								>
									{formatDistanceToNow(new Date(e.performedAt), {
										addSuffix: true,
										locale: es,
									})}
								</time>
							</div>

							{e.oldValue !== null && e.newValue !== null && (
								<p className="mt-0.5 text-text-tertiary truncate">
									<span className="line-through opacity-60">{e.oldValue || "—"}</span>
									{" → "}
									<span className="text-text-secondary">{e.newValue || "—"}</span>
								</p>
							)}

							<p className="text-text-tertiary">por {e.performedBy}</p>
						</div>
					</li>
				))}
			</ol>

			{hasNextPage && (
				<Button
					variant="ghost"
					size="sm"
					className="w-full"
					onClick={() => fetchNextPage()}
					disabled={isFetchingNextPage}
				>
					{isFetchingNextPage ? <Loader2 size={12} className="animate-spin" /> : "Cargar más"}
				</Button>
			)}
		</div>
	);
}
