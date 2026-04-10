import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
	{
		variants: {
			variant: {
				default:   "bg-bg-elevated text-text-secondary ring-border-default",
				primary:   "bg-blue-400/15 text-blue-300 ring-blue-400/30",
				ai:        "bg-violet-400/15 text-violet-300 ring-violet-400/30",
				// 9 lifecycle statuses
				prospecto:         "bg-gray-500/15 text-gray-400 ring-gray-500/30",
				contactado:        "bg-sky-400/15 text-sky-300 ring-sky-400/30",
				confirmado:        "bg-violet-400/15 text-violet-300 ring-violet-400/30",
				en_brief:          "bg-amber-400/15 text-amber-300 ring-amber-400/30",
				contenido_enviado: "bg-orange-400/15 text-orange-300 ring-orange-400/30",
				aprobado:          "bg-lime-400/15 text-lime-300 ring-lime-400/30",
				publicado:         "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
				verificado:        "bg-cyan-400/15 text-cyan-300 ring-cyan-400/30",
				pagado:            "bg-teal-400/15 text-teal-300 ring-teal-400/30",
			},
		},
		defaultVariants: { variant: "default" },
	},
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export interface BadgeProps
	extends React.HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
	return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Map an assignment_status string to the matching Badge variant. */
export function statusVariant(status: string): BadgeVariant {
	const map: Record<string, BadgeVariant> = {
		prospecto:         "prospecto",
		contactado:        "contactado",
		confirmado:        "confirmado",
		en_brief:          "en_brief",
		contenido_enviado: "contenido_enviado",
		aprobado:          "aprobado",
		publicado:         "publicado",
		verificado:        "verificado",
		pagado:            "pagado",
	};
	return map[status] ?? "default";
}

/** Human-readable label for each assignment status. */
export const STATUS_LABELS: Record<string, string> = {
	prospecto:         "Prospecto",
	contactado:        "Contactado",
	confirmado:        "Confirmado",
	en_brief:          "En brief",
	contenido_enviado: "Contenido enviado",
	aprobado:          "Aprobado",
	publicado:         "Publicado",
	verificado:        "Verificado",
	pagado:            "Pagado",
};
