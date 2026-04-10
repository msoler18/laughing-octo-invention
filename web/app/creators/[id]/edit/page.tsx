import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { CreatorForm } from "@/features/creators/creator-form";
import { AuditFeed } from "@/features/creators/audit-feed";
import { updateCreator } from "../../actions";
import type { CreatorDetail } from "@/features/creators/types";

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
	const body = await res.json() as { data: unknown[] };
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
			<Topbar
				title={creator.fullName}
				description={`@${creator.instagramHandle}`}
			/>
			<div className="flex gap-8 p-6">
				{/* Form — M2-12 */}
				<div className="flex-1 min-w-0">
					<CreatorForm
						creator={creator}
						action={action}
						submitLabel="Guardar cambios"
					/>
				</div>

				{/* Audit log — M2-14 */}
				<aside className="w-72 shrink-0">
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
