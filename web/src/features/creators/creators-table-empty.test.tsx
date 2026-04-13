import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreatorsTable } from "./creators-table";
import type { CreatorRow } from "./types";

const emptyRows: CreatorRow[] = [];

describe("CreatorsTable — empty states", () => {
	it("shows 'Sin creadores todavía' when no rows and no active filters", () => {
		render(
			<CreatorsTable rows={emptyRows} isLoading={false} isError={false} hasActiveFilters={false} />
		);
		expect(screen.getByText("Sin creadores todavía")).toBeInTheDocument();
		expect(screen.getByText(/Importa creadores con un CSV/)).toBeInTheDocument();
	});

	it("shows 'Sin resultados para estos filtros' when filters are active", () => {
		render(
			<CreatorsTable rows={emptyRows} isLoading={false} isError={false} hasActiveFilters={true} />
		);
		expect(screen.getByText("Sin resultados para estos filtros")).toBeInTheDocument();
		expect(screen.getByText(/Prueba ajustando o limpiando/)).toBeInTheDocument();
	});

	it("shows 'Limpiar filtros' button when filters active and onClearFilters provided", () => {
		const onClear = vi.fn();
		render(
			<CreatorsTable
				rows={emptyRows}
				isLoading={false}
				isError={false}
				hasActiveFilters={true}
				onClearFilters={onClear}
			/>
		);
		expect(screen.getByText("Limpiar filtros")).toBeInTheDocument();
	});

	it("calls onClearFilters when 'Limpiar filtros' is clicked", async () => {
		const user = userEvent.setup();
		const onClear = vi.fn();
		render(
			<CreatorsTable
				rows={emptyRows}
				isLoading={false}
				isError={false}
				hasActiveFilters={true}
				onClearFilters={onClear}
			/>
		);
		await user.click(screen.getByText("Limpiar filtros"));
		expect(onClear).toHaveBeenCalledOnce();
	});

	it("does NOT show 'Limpiar filtros' when no onClearFilters provided", () => {
		render(
			<CreatorsTable rows={emptyRows} isLoading={false} isError={false} hasActiveFilters={true} />
		);
		expect(screen.queryByText("Limpiar filtros")).not.toBeInTheDocument();
	});
});
