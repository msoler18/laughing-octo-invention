"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import {
	Dialog, DialogContent, DialogHeader,
	DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useImportJob } from "./use-import-job";

interface ImportCsvDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function ImportCsvDialog({ open, onOpenChange, onSuccess }: ImportCsvDialogProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [jobId, setJobId]     = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const { data: job } = useImportJob(jobId);

	async function handleFile(file: File) {
		if (!file.name.endsWith(".csv")) {
			setUploadError("Solo se aceptan archivos CSV.");
			return;
		}

		setUploading(true);
		setUploadError(null);
		setJobId(null);

		try {
			const form = new FormData();
			form.append("file", file);

			const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
			const res = await fetch(`${apiBase}/api/v1/import/creators`, {
				method: "POST",
				body: form,
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.message ?? `Error ${res.status}`);
			}

			const data = await res.json() as { jobId: string };
			setJobId(data.jobId);
		} catch (err) {
			setUploadError(err instanceof Error ? err.message : "Error desconocido");
		} finally {
			setUploading(false);
		}
	}

	function handleClose() {
		// Only reset when job is done or there's no active job
		if (!jobId || job?.status === "done" || job?.status === "failed") {
			setJobId(null);
			setUploadError(null);
			if (job?.status === "done") onSuccess?.();
			onOpenChange(false);
		}
	}

	const isDone    = job?.status === "done";
	const isFailed  = job?.status === "failed";
	const isRunning = jobId && !isDone && !isFailed;

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Importar creadores desde CSV</DialogTitle>
					<DialogDescription>
						Sube un archivo CSV con creadores. Columnas soportadas: instagram_handle,
						full_name, followers_count, engagment_rate (typo OK), city, creator_tier, y más.
					</DialogDescription>
				</DialogHeader>

				{/* Upload zone — shown before job starts */}
				{!jobId && (
					<div
						onClick={() => inputRef.current?.click()}
						onDragOver={(e) => e.preventDefault()}
						onDrop={(e) => {
							e.preventDefault();
							const f = e.dataTransfer.files[0];
							if (f) handleFile(f);
						}}
						className="mt-2 flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border-default py-10 px-6 cursor-pointer hover:border-blue-400/50 hover:bg-blue-400/5 transition-colors"
					>
						<Upload size={24} className="text-text-tertiary" />
						<div className="text-center">
							<p className="text-sm font-medium text-text-primary">
								{uploading ? "Subiendo…" : "Arrastra el CSV aquí"}
							</p>
							<p className="text-xs text-text-tertiary mt-0.5">o haz clic para seleccionar</p>
						</div>
						<input
							ref={inputRef}
							type="file"
							accept=".csv"
							className="hidden"
							onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
						/>
					</div>
				)}

				{uploadError && (
					<p className="mt-2 text-xs text-red-400">{uploadError}</p>
				)}

				{/* Job progress */}
				{jobId && (
					<div className="mt-4 space-y-3">
						{/* Status indicator */}
						<div className="flex items-center gap-3">
							{isRunning  && <Loader2 size={16} className="animate-spin text-blue-400" />}
							{isDone     && <CheckCircle2 size={16} className="text-emerald-400" />}
							{isFailed   && <XCircle size={16} className="text-red-400" />}
							<p className="text-sm font-medium text-text-primary capitalize">
								{job?.status === "queued"      && "En cola…"}
								{job?.status === "processing"  && "Procesando filas…"}
								{isDone                        && "Importación completada"}
								{isFailed                      && "Error en la importación"}
							</p>
						</div>

						{/* Counters */}
						{(isDone || isFailed) && job && (
							<div className="rounded-lg bg-bg-elevated px-4 py-3 space-y-1 text-xs">
								<div className="flex justify-between">
									<span className="text-text-secondary">Filas importadas</span>
									<span className="font-mono text-emerald-400">{job.rowsProcessed}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-text-secondary">Filas rechazadas</span>
									<span className="font-mono text-amber-400">{job.rowsSkipped}</span>
								</div>
							</div>
						)}

						{/* Error log */}
						{job && job.errorLog.length > 0 && (
							<div className="max-h-36 overflow-y-auto rounded-lg bg-bg-elevated px-4 py-3 space-y-1">
								<p className="text-xs font-semibold text-text-secondary mb-2">Errores por fila</p>
								{job.errorLog.map((e) => (
									<p key={e.row} className="text-xs text-text-tertiary font-mono">
										<span className="text-amber-400">fila {e.row}</span> — {e.error}
									</p>
								))}
							</div>
						)}
					</div>
				)}

				{/* Footer actions */}
				<div className="mt-4 flex justify-end gap-2">
					{(isDone || isFailed) && (
						<Button variant="primary" size="sm" onClick={handleClose}>
							{isDone ? "Ver creadores" : "Cerrar"}
						</Button>
					)}
					{!jobId && (
						<DialogClose asChild>
							<Button variant="secondary" size="sm">Cancelar</Button>
						</DialogClose>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
