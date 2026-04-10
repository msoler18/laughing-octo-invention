"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { CreatorsTable } from "@/features/creators/creators-table";
import { CreatorsFiltersPanel } from "@/features/creators/creators-filters";
import { ImportCsvDialog } from "@/features/creators/import-csv-dialog";
import { useCreators } from "@/features/creators/use-creators";
import type { CreatorsFilters } from "@/features/creators/types";

export default function CreatorsPage() {
	const router = useRouter();
	const [filters, setFilters] = useState<CreatorsFilters>({ page: 1, limit: 25 });
	const [importOpen, setImportOpen] = useState(false);

	const { data, isLoading, isError, refetch } = useCreators(filters);

	const pagination = data?.pagination;
	const rows       = data?.data ?? [];

	function setPage(next: number) {
		setFilters((f) => ({ ...f, page: next }));
	}

	return (
		<>
			{/* M2-01 topbar */}
			<Topbar
				title="Creadores"
				description={
					pagination
						? `${pagination.total.toLocaleString("es-CO")} creadores en total`
						: undefined
				}
				actions={
					<Button
						variant="secondary"
						size="sm"
						onClick={() => setImportOpen(true)}
					>
						<Upload size={14} />
						Importar CSV
					</Button>
				}
			/>

			{/* Content */}
			<div className="flex flex-1 gap-6 p-6">
				{/* M2-07 — Filters sidebar */}
				<CreatorsFiltersPanel filters={filters} onChange={setFilters} />

				{/* Table + pagination */}
				<div className="flex flex-1 flex-col gap-4 min-w-0">
					{/* M2-06 — DataTable */}
					<CreatorsTable
						rows={rows}
						isLoading={isLoading}
						isError={isError}
						onRowClick={(id) => router.push(`/creators/${id}/edit`)}
					/>

					{/* M2-08 — Pagination */}
					{pagination && pagination.pages > 1 && (
						<div className="flex items-center justify-between text-sm">
							<p className="text-text-tertiary">
								Página {pagination.page} de {pagination.pages} ·{" "}
								{pagination.total.toLocaleString("es-CO")} resultados
							</p>
							<div className="flex items-center gap-2">
								<Button
									variant="secondary"
									size="sm"
									disabled={pagination.page <= 1}
									onClick={() => setPage(pagination.page - 1)}
								>
									<ChevronLeft size={14} />
									Anterior
								</Button>
								<Button
									variant="secondary"
									size="sm"
									disabled={pagination.page >= pagination.pages}
									onClick={() => setPage(pagination.page + 1)}
								>
									Siguiente
									<ChevronRight size={14} />
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* M2-10 — Import CSV dialog */}
			<ImportCsvDialog
				open={importOpen}
				onOpenChange={setImportOpen}
				onSuccess={() => refetch()}
			/>
		</>
	);
}
