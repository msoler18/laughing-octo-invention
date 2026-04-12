import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ScoreBadge } from "@/components/ui/score-badge";
import { AuditFeed } from "@/features/creators/audit-feed";
import { CreatorForm } from "@/features/creators/creator-form";
import type { CreatorDetail } from "@/features/creators/types";
import { updateCreator } from "../../actions";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function getCreator(id: string): Promise<CreatorDetail | null> {
	const res = await fetch(`${API}/api/v1/creators/${id}`, { cache: "no-store" });
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`Failed to fetch creator: ${res.status}`);
	return res.json() as Promise<CreatorDetail>;
}

async function getAuditLog(id: string) {
	const res = await fetch(`${API}/api/v1/creators/${id}/audit?limit=20`, { cache: "no-store" });
	if (!res.ok) return [];
	const body = (await res.json()) as { data: unknown[] };
	return body.data;
}

interface Props {
	params: Promise<{ id: string }>;
}

export default async function EditCreatorPage({ params }: Props) {
	const { id } = await params;
	const [creator, auditEvents] = await Promise.all([getCreator(id), getAuditLog(id)]);

	if (!creator) notFound();

	// Bind the creator ID into the server action
	const action = updateCreator.bind(null, id);

	return (
		<>
			<Topbar title={creator.fullName} description={`@${creator.instagramHandle}`} />
			<div className="flex gap-8 p-6">
				{/* Form — M2-12 */}
				<div className="flex-1 min-w-0">
					<CreatorForm creator={creator} action={action} submitLabel="Guardar cambios" />
				</div>

				{/* Sidebar — M5-04 score + M2-14 audit */}
				<aside className="w-72 shrink-0 space-y-4">
					{/* Score breakdown */}
					{creator.score && (
						<div className="rounded-lg bg-bg-surface ring-1 ring-border-default p-4 space-y-3">
							<h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
								Creator Score
							</h2>
							<div className="flex items-center gap-2">
								<ScoreBadge
									score={creator.score}
									breakdown={{
										engagementWeight: creator.engagementWeight,
										tierWeight: creator.tierWeight,
										consistencyWeight: creator.consistencyWeight,
										campaignHistoryWeight: creator.campaignHistoryWeight,
									}}
									size="md"
								/>
								{creator.scoreCalculatedAt && (
									<span className="text-xs text-text-tertiary">
										calc. {new Date(creator.scoreCalculatedAt).toLocaleDateString("es-CO")}
									</span>
								)}
							</div>
							<div className="space-y-2">
								{(
									[
										{ label: "Eng. quality", value: creator.engagementWeight, max: 40 },
										{ label: "Tier", value: creator.tierWeight, max: 30 },
										{ label: "Consistencia", value: creator.consistencyWeight, max: 20 },
										{ label: "Campañas", value: creator.campaignHistoryWeight, max: 10 },
									] as const
								).map(({ label, value, max }) => {
									const n = parseFloat(value ?? "0");
									const pct = max > 0 ? (n / max) * 100 : 0;
									return (
										<div key={label} className="space-y-0.5">
											<div className="flex justify-between text-xs">
												<span className="text-text-secondary">{label}</span>
												<span className="font-mono text-text-primary">
													{n.toFixed(0)}
													<span className="text-text-tertiary">/{max}</span>
												</span>
											</div>
											<div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
												<div
													className="h-full rounded-full bg-blue-400 transition-all"
													style={{ width: `${pct}%` }}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* Audit log — M2-14 */}
					<div className="sticky top-6 rounded-lg bg-bg-surface ring-1 ring-border-default p-4">
						<h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">
							Historial de cambios
						</h2>
						<AuditFeed events={auditEvents as Parameters<typeof AuditFeed>[0]["events"]} />
					</div>
				</aside>
			</div>
		</>
	);
}
