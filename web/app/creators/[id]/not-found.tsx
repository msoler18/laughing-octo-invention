import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CreatorNotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
			<p className="text-4xl font-bold font-mono text-text-tertiary">404</p>
			<p className="mt-3 text-sm font-medium text-text-primary">Creador no encontrado</p>
			<p className="mt-1 text-xs text-text-tertiary max-w-xs">
				Este creador no existe o fue eliminado. Vuelve al listado para continuar.
			</p>
			<Button variant="secondary" size="sm" className="mt-5" asChild>
				<Link href="/creators">Volver a creadores</Link>
			</Button>
		</div>
	);
}
