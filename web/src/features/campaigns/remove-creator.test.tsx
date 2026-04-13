import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Providers } from "@/../app/providers";
import { server } from "@/mocks/node";
import { AssignmentsTable } from "./assignments-table";
import type { Assignment } from "./types";

// ── Fixture ───────────────────────────────────────────────────────────────────

const CAMPAIGN_ID = "00000000-0000-0000-0000-000000000010";
const CREATOR_ID = "00000000-0000-0000-0000-000000000001";

const assignment: Assignment = {
	id: "asgn-1",
	creatorId: CREATOR_ID,
	instagramHandle: "test_creator",
	fullName: "Creator Test",
	followersCount: 25000,
	creatorTier: "micro",
	assignmentStatus: "confirmado",
	score: "78",
	postUrl: null,
	notes: null,
	impressions: null,
	reach: null,
	saves: null,
	likes: null,
	comments: null,
	metricsEnteredBy: null,
	metricsEnteredAt: null,
	statusUpdatedAt: new Date().toISOString(),
	assignedAt: new Date().toISOString(),
	confirmedAt: null,
	publishedAt: null,
	verifiedAt: null,
	paidAt: null,
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderTable() {
	return render(
		<Providers>
			<AssignmentsTable assignments={[assignment]} campaignId={CAMPAIGN_ID} />
		</Providers>
	);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AssignmentsTable — remove creator", () => {
	it("shows trash icon button for each row", () => {
		renderTable();
		expect(
			screen.getByRole("button", { name: /Eliminar creador de la campaña/i })
		).toBeInTheDocument();
	});

	it("shows confirm/cancel buttons on trash click", async () => {
		const user = userEvent.setup();
		renderTable();
		await user.click(screen.getByRole("button", { name: /Eliminar creador de la campaña/i }));
		expect(screen.getByRole("button", { name: /Confirmar eliminación/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Cancelar eliminación/i })).toBeInTheDocument();
	});

	it("cancels and returns to trash icon on Cancelar click", async () => {
		const user = userEvent.setup();
		renderTable();
		await user.click(screen.getByRole("button", { name: /Eliminar creador de la campaña/i }));
		await user.click(screen.getByRole("button", { name: /Cancelar eliminación/i }));
		expect(
			screen.getByRole("button", { name: /Eliminar creador de la campaña/i })
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /Confirmar eliminación/i })
		).not.toBeInTheDocument();
	});

	it("calls DELETE endpoint on confirm", async () => {
		let deleted = false;
		server.use(
			http.delete(
				`http://localhost:3001/api/v1/campaigns/${CAMPAIGN_ID}/creators/${CREATOR_ID}`,
				() => {
					deleted = true;
					return new HttpResponse(null, { status: 204 });
				}
			)
		);

		const user = userEvent.setup();
		renderTable();
		await user.click(screen.getByRole("button", { name: /Eliminar creador de la campaña/i }));
		await user.click(screen.getByRole("button", { name: /Confirmar eliminación/i }));
		expect(deleted).toBe(true);
	});
});
