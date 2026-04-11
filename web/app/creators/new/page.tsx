import { Topbar } from "@/components/layout/topbar";
import { CreatorForm } from "@/features/creators/creator-form";
import { createCreator } from "../actions";

export default function NewCreatorPage() {
	return (
		<>
			<Topbar title="Nuevo creador" description="Completa los datos del perfil" />
			<div className="flex gap-8 p-6">
				<div className="flex-1 min-w-0">
					<CreatorForm action={createCreator} submitLabel="Crear creador" />
				</div>
			</div>
		</>
	);
}
