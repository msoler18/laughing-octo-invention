"use client";

import { Plus } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

function SubmitButton() {
	const { pending } = useFormStatus();
	return (
		<Button type="submit" variant="primary" size="sm" disabled={pending}>
			{pending ? "Creando…" : "Crear campaña"}
		</Button>
	);
}

function Field({
	label,
	name,
	children,
}: {
	label: string;
	name: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-1">
			<label htmlFor={name} className="block text-xs font-medium text-text-secondary">
				{label}
			</label>
			{children}
		</div>
	);
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { name: string }) {
	return (
		<input
			id={props.name}
			className="w-full rounded-lg bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary ring-1 ring-border-default focus:outline-none focus:ring-border-focus"
			{...props}
		/>
	);
}

type ActionFn = (prev: unknown, formData: FormData) => Promise<{ error: string } | undefined>;

export function NewCampaignButton({ createAction }: { createAction: ActionFn }) {
	const [open, setOpen] = useState(false);
	const [state, formAction] = useActionState<{ error: string } | undefined, FormData>(
		createAction,
		undefined
	);

	// Close dialog on successful redirect (action throws redirect, won't reach here)
	// If there's an error, state.error will be set

	return (
		<>
			<Button variant="primary" size="sm" onClick={() => setOpen(true)}>
				<Plus size={14} />
				Nueva campaña
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Nueva campaña</DialogTitle>
						<DialogDescription>Crea una campaña de Crowdposting.</DialogDescription>
					</DialogHeader>

					<form action={formAction} className="mt-2 space-y-4">
						{state?.error && <p className="text-xs text-red-400">{state.error}</p>}

						<div className="grid grid-cols-2 gap-3">
							<Field label="Nombre *" name="name">
								<Input name="name" placeholder="Campaña verano 2026" required />
							</Field>
							<Field label="Marca *" name="brand">
								<Input name="brand" placeholder="Nike" required />
							</Field>
						</div>

						<Field label="Descripción" name="description">
							<Input name="description" placeholder="Breve descripción…" />
						</Field>

						<Field label="Brief" name="briefText">
							<textarea
								id="briefText"
								name="briefText"
								rows={3}
								placeholder="Instrucciones para los creadores…"
								className="w-full rounded-lg bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary ring-1 ring-border-default focus:outline-none focus:ring-border-focus resize-none"
							/>
						</Field>

						<div className="grid grid-cols-2 gap-3">
							<Field label="Inicio" name="startDate">
								<Input name="startDate" type="date" />
							</Field>
							<Field label="Fin" name="endDate">
								<Input name="endDate" type="date" />
							</Field>
						</div>

						<Field label="Meta de creadores" name="targetCreatorCount">
							<Input name="targetCreatorCount" type="number" min={0} placeholder="200" />
						</Field>

						<div className="flex justify-end gap-2 pt-1">
							<Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
								Cancelar
							</Button>
							<SubmitButton />
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
