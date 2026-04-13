import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreatorsTable } from "./creators-table";
import type { CreatorRow } from "./types";

const baseRow: CreatorRow = {
	id: "00000000-0000-0000-0000-000000000001",
	instagramHandle: "test_creator",
	fullName: "Creator Test",
	country: null,
	city: "Bogotá",
	creatorTier: "micro",
	followersCount: 25000,
	engagementRate: "4.50",
	engagementQuality: "high",
	consistencyScore: null,
	campaignsParticipated: 0,
	tags: null,
	embeddingUpdatedAt: null,
	score: "78",
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("CreatorsTable", () => {
	it("renders a row with creator name and handle", () => {
		render(<CreatorsTable rows={[baseRow]} isLoading={false} isError={false} />);
		expect(screen.getByText("Creator Test")).toBeInTheDocument();
		expect(screen.getByText("@test_creator")).toBeInTheDocument();
	});

	it("shows skeleton rows when loading", () => {
		const { container } = render(<CreatorsTable rows={[]} isLoading={true} isError={false} />);
		// 8 skeleton rows expected
		const skeletons = container.querySelectorAll(".animate-pulse");
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it("shows empty state when no rows and not loading", () => {
		render(<CreatorsTable rows={[]} isLoading={false} isError={false} />);
		expect(screen.getByText("Sin creadores todavía")).toBeInTheDocument();
	});

	it("shows error state", () => {
		render(<CreatorsTable rows={[]} isLoading={false} isError={true} />);
		expect(screen.getByText("Error al cargar creadores")).toBeInTheDocument();
	});

	it("calls onSort with score desc on first click", async () => {
		const user = userEvent.setup();
		const onSort = vi.fn();
		render(
			<CreatorsTable
				rows={[baseRow]}
				isLoading={false}
				isError={false}
				sortBy="created_at"
				sortOrder="desc"
				onSort={onSort}
			/>
		);
		await user.click(screen.getByText("Score", { exact: false }));
		expect(onSort).toHaveBeenCalledWith("score", "desc");
	});

	it("toggles sort order on second click when already sorted by score", async () => {
		const user = userEvent.setup();
		const onSort = vi.fn();
		render(
			<CreatorsTable
				rows={[baseRow]}
				isLoading={false}
				isError={false}
				sortBy="score"
				sortOrder="desc"
				onSort={onSort}
			/>
		);
		await user.click(screen.getByText("Score", { exact: false }));
		expect(onSort).toHaveBeenCalledWith("score", "asc");
	});

	it("calls onRowClick with creator id when row is clicked", async () => {
		const user = userEvent.setup();
		const onRowClick = vi.fn();
		render(
			<CreatorsTable rows={[baseRow]} isLoading={false} isError={false} onRowClick={onRowClick} />
		);
		await user.click(screen.getByText("Creator Test"));
		expect(onRowClick).toHaveBeenCalledWith(baseRow.id);
	});
});
