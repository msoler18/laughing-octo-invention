"use client";

import { ChevronLeft, ChevronRight, Plus, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { CreatorsFiltersPanel } from "@/features/creators/creators-filters";
import { CreatorsTable } from "@/features/creators/creators-table";
import { ImportCsvDialog } from "@/features/creators/import-csv-dialog";
import { RAGResultsTable, RAGSearch } from "@/features/creators/rag-search";
import type { CreatorsFilters } from "@/features/creators/types";
import { useCreators } from "@/features/creators/use-creators";
import { useRAGSearch } from "@/features/creators/use-rag-search";

export default function CreatorsPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [filters, setFilters] = useState<CreatorsFilters>({ page: 1, limit: 25 });
	const [importOpen, setImportOpen] = useState(false);

	const hasActiveFilters = Boolean(
		filters.city ||
			filters.tier ||
			filters.engagement_quality ||
			filters.followers_min ||
			filters.followers_max
	);

	function clearFilters() {
		setFilters({ page: 1, limit: 25 });
	}

	// Show toast after redirect from Server Action
	useEffect(() => {
		const t = searchParams.get("toast");
		if (t === "created") toast.success("Creador añadido correctamente");
		if (t === "updated") toast.success("Creador actualizado correctamente");
	}, [searchParams]);

	const { data, isLoading, isError, refetch } = useCreators(filters);
	const rag = useRAGSearch();

	const pagination = data?.pagination;
	const rows = data?.data ?? [];

	function setPage(next: number) {
		setFilters((f) => ({ ...f, page: next }));
	}

	return (
		<>
			{/* M2-01 topbar */}
			<Topbar
				title="Creadores"
				description={
					rag.isActive
						? undefined
						: pagination
							? `${pagination.total.toLocaleString("es-CO")} creadores en total`
							: undefined
				}
				actions={
					<>
						<Button
							variant="secondary"
							size="sm"
							aria-label="Importar creadores desde CSV"
							onClick={() => setImportOpen(true)}
						>
							<Upload size={14} />
							Importar CSV
						</Button>
						<Button variant="primary" size="sm" onClick={() => router.push("/creators/new")}>
							<Plus size={14} />
							Nuevo creador
						</Button>
					</>
				}
			/>

			{/* Content */}
			<div className="flex flex-1 gap-6 p-6">
				{/* M2-07 — Filters sidebar: hidden in RAG mode */}
				{!rag.isActive && <CreatorsFiltersPanel filters={filters} onChange={setFilters} />}

				{/* Main column */}
				<div className="flex flex-1 flex-col gap-4 min-w-0">
					{/* M4-06 — RAG Search bar (always visible) */}
					<RAGSearch
						inputValue={rag.inputValue}
						onChange={rag.setInputValue}
						onSearch={rag.search}
						onClear={rag.clear}
						isActive={rag.isActive}
						isFetching={rag.isFetching}
						chips={rag.chips}
						onRemoveFilter={rag.removeFilter}
						total={rag.total}
						embeddingsPending={rag.embeddingsPending}
					/>

					{/* M4-07 — RAG results / regular table */}
					{rag.isActive ? (
						<RAGResultsTable
							results={rag.results}
							isLoading={rag.isLoading}
							onRowClick={(id) => router.push(`/creators/${id}/edit`)}
						/>
					) : (
						<>
							{/* M2-06 — DataTable */}
							<CreatorsTable
								rows={rows}
								isLoading={isLoading}
								isError={isError}
								hasActiveFilters={hasActiveFilters}
								onClearFilters={clearFilters}
								onRowClick={(id) => router.push(`/creators/${id}/edit`)}
								sortBy={filters.sort_by}
								sortOrder={filters.sort_order}
								onSort={(by, order) =>
									setFilters((f) => ({ ...f, sort_by: by, sort_order: order, page: 1 }))
								}
							/>

							{/* M2-08 — Pagination */}
							{pagination && pagination.pages > 1 && (
								<div className="flex items-center justify-between text-sm">
									<p className="text-text-tertiary">
										Página {pagination.page} de {pagination.pages} ·{" "}
										{pagination.total.toLocaleString("es-CO")} resultados
									</p>
									<nav aria-label="Paginación de creadores" className="flex items-center gap-2">
										<Button
											variant="secondary"
											size="sm"
											disabled={pagination.page <= 1}
											onClick={() => setPage(pagination.page - 1)}
											aria-label="Página anterior"
										>
											<ChevronLeft size={14} />
											Anterior
										</Button>
										<Button
											variant="secondary"
											size="sm"
											disabled={pagination.page >= pagination.pages}
											onClick={() => setPage(pagination.page + 1)}
											aria-label="Página siguiente"
										>
											Siguiente
											<ChevronRight size={14} />
										</Button>
									</nav>
								</div>
							)}
						</>
					)}
				</div>
			</div>

			{/* M2-10 — Import CSV dialog */}
			<ImportCsvDialog open={importOpen} onOpenChange={setImportOpen} onSuccess={() => refetch()} />
		</>
	);
}
