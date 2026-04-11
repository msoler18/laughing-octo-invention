"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { CreatorDetail } from "./types";

// ── Field primitives ──────────────────────────────────────────────────────────

function Field({
	label,
	name,
	required,
	error,
	children,
}: {
	label: string;
	name: string;
	required?: boolean;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-1">
			<label htmlFor={name} className="block text-xs font-medium text-text-secondary">
				{label}
				{required && <span className="ml-1 text-red-400">*</span>}
			</label>
			{children}
			{error && <p className="text-xs text-red-400">{error}</p>}
		</div>
	);
}

function Input({
	name,
	defaultValue,
	...props
}: React.InputHTMLAttributes<HTMLInputElement> & { name: string; defaultValue?: string | number }) {
	return (
		<input
			id={name}
			name={name}
			defaultValue={defaultValue}
			className="w-full rounded-lg bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary ring-1 ring-border-default focus:outline-none focus:ring-border-focus"
			{...props}
		/>
	);
}

function Textarea({
	name,
	defaultValue,
	...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { name: string; defaultValue?: string }) {
	return (
		<textarea
			id={name}
			name={name}
			defaultValue={defaultValue}
			rows={3}
			className="w-full rounded-lg bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary ring-1 ring-border-default focus:outline-none focus:ring-border-focus resize-none"
			{...props}
		/>
	);
}

function Select({
	name,
	defaultValue,
	children,
}: {
	name: string;
	defaultValue?: string;
	children: React.ReactNode;
}) {
	return (
		<select
			id={name}
			name={name}
			defaultValue={defaultValue ?? ""}
			className="w-full rounded-lg bg-bg-elevated px-3 py-2 text-sm text-text-primary ring-1 ring-border-default focus:outline-none focus:ring-border-focus"
		>
			{children}
		</select>
	);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide pt-2 pb-1 border-b border-border-default">
			{children}
		</h3>
	);
}

function SubmitButton({ label }: { label: string }) {
	const { pending } = useFormStatus();
	return (
		<Button type="submit" variant="primary" size="md" disabled={pending}>
			{pending ? "Guardando…" : label}
		</Button>
	);
}

// ── Main form ─────────────────────────────────────────────────────────────────

interface CreatorFormProps {
	creator?: CreatorDetail;
	action: (prev: unknown, formData: FormData) => Promise<{ error: string } | undefined>;
	submitLabel: string;
}

export function CreatorForm({ creator, action, submitLabel }: CreatorFormProps) {
	const [state, formAction] = useActionState(action, undefined);

	return (
		<form action={formAction} className="space-y-6 max-w-2xl">
			{state?.error && (
				<div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/30">
					{state.error}
				</div>
			)}

			{/* ── Identidad ─────────────────────────────────────────────────── */}
			<SectionTitle>Identidad</SectionTitle>
			<div className="grid grid-cols-2 gap-4">
				<Field label="Handle de Instagram" name="instagramHandle" required>
					<Input
						name="instagramHandle"
						placeholder="@usuario"
						defaultValue={creator?.instagramHandle}
						required
					/>
				</Field>
				<Field label="Nombre completo" name="fullName" required>
					<Input
						name="fullName"
						placeholder="María García"
						defaultValue={creator?.fullName}
						required
					/>
				</Field>
				<Field label="Teléfono" name="phone">
					<Input name="phone" placeholder="+57 300 000 0000" defaultValue={creator?.phone ?? ""} />
				</Field>
				<Field label="Email" name="email">
					<Input
						name="email"
						type="email"
						placeholder="maria@ejemplo.com"
						defaultValue={creator?.email ?? ""}
					/>
				</Field>
				<Field label="País" name="country">
					<Input name="country" placeholder="Colombia" defaultValue={creator?.country ?? ""} />
				</Field>
				<Field label="Ciudad" name="city">
					<Input name="city" placeholder="Bogotá" defaultValue={creator?.city ?? ""} />
				</Field>
				<Field label="Handle TikTok" name="tiktokHandle">
					<Input
						name="tiktokHandle"
						placeholder="@usuario"
						defaultValue={creator?.tiktokHandle ?? ""}
					/>
				</Field>
			</div>

			{/* ── Métricas de alcance ────────────────────────────────────────── */}
			<SectionTitle>Métricas de alcance</SectionTitle>
			<div className="grid grid-cols-2 gap-4">
				<Field label="Seguidores" name="followersCount">
					<Input
						name="followersCount"
						type="number"
						min={0}
						defaultValue={creator?.followersCount}
					/>
				</Field>
				<Field label="Engagement rate (%)" name="engagementRate">
					<Input
						name="engagementRate"
						type="number"
						min={0}
						step="0.01"
						defaultValue={creator?.engagementRate}
					/>
				</Field>
				<Field label="Promedio likes (últimos 10)" name="avgLikesLast10">
					<Input
						name="avgLikesLast10"
						type="number"
						min={0}
						step="0.01"
						defaultValue={creator?.avgLikesLast10 ?? ""}
					/>
				</Field>
				<Field label="Reach rate (%)" name="reachRate">
					<Input
						name="reachRate"
						type="number"
						min={0}
						step="0.01"
						defaultValue={creator?.reachRate ?? ""}
					/>
				</Field>
			</div>

			{/* ── Clasificación ─────────────────────────────────────────────── */}
			<SectionTitle>Clasificación</SectionTitle>
			<div className="grid grid-cols-2 gap-4">
				<Field label="Tier" name="creatorTier">
					<Select name="creatorTier" defaultValue={creator?.creatorTier}>
						<option value="nano">Nano (&lt;10K)</option>
						<option value="micro">Micro (10–100K)</option>
						<option value="mid">Mid (100K–500K)</option>
						<option value="macro">Macro (500K–1M)</option>
						<option value="mega">Mega (&gt;1M)</option>
					</Select>
				</Field>
				<Field label="Calidad de engagement" name="engagementQuality">
					<Select name="engagementQuality" defaultValue={creator?.engagementQuality}>
						<option value="zero">Zero</option>
						<option value="low">Bajo</option>
						<option value="average">Promedio</option>
						<option value="high">Alto</option>
						<option value="viral">Viral</option>
					</Select>
				</Field>
				<Field label="Formato dominante" name="dominantFormat">
					<Select name="dominantFormat" defaultValue={creator?.dominantFormat ?? ""}>
						<option value="">— Sin especificar —</option>
						<option value="Reels">Reels</option>
						<option value="carousel">Carousel</option>
						<option value="photo">Foto</option>
					</Select>
				</Field>
				<Field label="Idioma del contenido" name="contentLanguage">
					<Input
						name="contentLanguage"
						placeholder="es"
						defaultValue={creator?.contentLanguage ?? ""}
					/>
				</Field>
			</div>

			{/* ── Contexto ──────────────────────────────────────────────────── */}
			<SectionTitle>Contexto</SectionTitle>
			<div className="space-y-4">
				<Field label="Bio" name="bioText">
					<Textarea
						name="bioText"
						placeholder="Descripción del creador…"
						defaultValue={creator?.bioText ?? ""}
					/>
				</Field>
				<div className="grid grid-cols-2 gap-4">
					<Field label="Keywords (separadas por coma)" name="bioKeywords">
						<Input
							name="bioKeywords"
							placeholder="moda, lifestyle, viajes"
							defaultValue={creator?.bioKeywords?.join(", ") ?? ""}
						/>
					</Field>
					<Field label="Tags (separados por coma)" name="tags">
						<Input
							name="tags"
							placeholder="vip, recurrente"
							defaultValue={creator?.tags?.join(", ") ?? ""}
						/>
					</Field>
				</div>
			</div>

			{/* ── Comercial ─────────────────────────────────────────────────── */}
			<SectionTitle>Comercial</SectionTitle>
			<div className="grid grid-cols-2 gap-4">
				<Field label="Tarifa (USD)" name="contentRateUsd">
					<Input
						name="contentRateUsd"
						type="number"
						min={0}
						step="0.01"
						defaultValue={creator?.contentRateUsd ?? ""}
					/>
				</Field>
				<Field label="Método de pago" name="paymentMethod">
					<Input
						name="paymentMethod"
						placeholder="Nequi, transferencia…"
						defaultValue={creator?.paymentMethod ?? ""}
					/>
				</Field>
				<Field label="Estado de onboarding" name="onboardingStatus">
					<Input
						name="onboardingStatus"
						placeholder="pendiente, completado…"
						defaultValue={creator?.onboardingStatus ?? ""}
					/>
				</Field>
				<Field label="Campañas participadas" name="campaignsParticipated">
					<Input
						name="campaignsParticipated"
						type="number"
						min={0}
						defaultValue={creator?.campaignsParticipated}
					/>
				</Field>
			</div>

			<Field label="Notas internas" name="notes">
				<Textarea
					name="notes"
					placeholder="Notas del equipo…"
					defaultValue={creator?.notes ?? ""}
				/>
			</Field>

			{/* ── Actions ───────────────────────────────────────────────────── */}
			<div className="flex items-center gap-3 pt-2">
				<SubmitButton label={submitLabel} />
				<Button type="button" variant="ghost" size="md" onClick={() => history.back()}>
					Cancelar
				</Button>
			</div>
		</form>
	);
}
