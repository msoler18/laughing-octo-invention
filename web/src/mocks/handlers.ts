import { HttpResponse, http } from "msw";

// Base URL for the Fastify API in tests
const API = "http://localhost:3001/api/v1";

// ── Fixture data ──────────────────────────────────────────────────────────────

export const mockCreator = {
	id: "00000000-0000-0000-0000-000000000001",
	instagramHandle: "test_creator",
	fullName: "Creator Test",
	city: "Bogotá",
	creatorTier: "micro",
	followersCount: 25000,
	engagementRate: "4.50",
	engagementQuality: "high",
	bio: "Test bio",
	score: "78",
	engagementWeight: "32",
	tierWeight: "22",
	consistencyWeight: "16",
	campaignHistoryWeight: "8",
	createdAt: "2024-01-01T00:00:00.000Z",
};

export const mockCampaign = {
	id: "00000000-0000-0000-0000-000000000010",
	name: "Campaña Test",
	brand: "Marca Test",
	status: "activa",
	startDate: "2024-01-01",
	endDate: "2024-03-31",
	budget: "1000000",
	totalAssigned: 3,
	totalPublished: 1,
	impressions: 5000,
	reach: 4000,
	saves: 200,
	createdAt: "2024-01-01T00:00:00.000Z",
};

export const mockAssignment = {
	id: "00000000-0000-0000-0000-000000000020",
	creatorId: mockCreator.id,
	campaignId: mockCampaign.id,
	assignmentStatus: "confirmado",
	instagramHandle: mockCreator.instagramHandle,
	fullName: mockCreator.fullName,
	city: mockCreator.city,
	creatorTier: mockCreator.creatorTier,
	score: mockCreator.score,
	postUrl: null,
	impressions: null,
	reach: null,
	saves: null,
	likes: null,
	comments: null,
	statusUpdatedAt: "2024-01-10T00:00:00.000Z",
};

// ─── Default handlers ────────────────────────────────────────────────────────

export const handlers = [
	// Health check
	http.get(`${API}/health`, () =>
		HttpResponse.json({
			status: "ok",
			version: "1.0.0",
			timestamp: new Date().toISOString(),
		})
	),

	// Creators list
	http.get(`${API}/creators`, () =>
		HttpResponse.json({
			data: [mockCreator],
			total: 1,
			page: 1,
			pageSize: 20,
		})
	),

	// Single creator
	http.get(`${API}/creators/:id`, ({ params }) => {
		if (params.id === mockCreator.id) return HttpResponse.json(mockCreator);
		return HttpResponse.json({ error: "Not found" }, { status: 404 });
	}),

	// Update creator
	http.patch(`${API}/creators/:id`, async ({ request, params }) => {
		const body = await request.json();
		return HttpResponse.json({ ...mockCreator, ...(body as object), id: params.id });
	}),

	// Campaigns list
	http.get(`${API}/campaigns`, () =>
		HttpResponse.json({
			data: [mockCampaign],
			total: 1,
			page: 1,
			pageSize: 20,
		})
	),

	// Single campaign
	http.get(`${API}/campaigns/:id`, ({ params }) => {
		if (params.id === mockCampaign.id) return HttpResponse.json(mockCampaign);
		return HttpResponse.json({ error: "Not found" }, { status: 404 });
	}),

	// Campaign assignments
	http.get(`${API}/campaigns/:id/creators`, () => HttpResponse.json([mockAssignment])),

	// Add creator to campaign
	http.post(`${API}/campaigns/:campaignId/creators`, () =>
		HttpResponse.json(mockAssignment, { status: 201 })
	),

	// Update assignment status
	http.patch(`${API}/campaigns/:campaignId/creators/:creatorId/status`, async ({ request }) => {
		const body = (await request.json()) as { status: string };
		return HttpResponse.json({ ...mockAssignment, assignmentStatus: body.status });
	}),

	// Update assignment metrics
	http.patch(`${API}/campaigns/:campaignId/creators/:creatorId/metrics`, async ({ request }) => {
		const body = await request.json();
		return HttpResponse.json({ ...mockAssignment, ...(body as object) });
	}),

	// Chat (returns a minimal SSE response)
	http.post(
		`${API}/chat`,
		() =>
			new HttpResponse('data: {"type":"text","value":"Encontré 1 creador."}\ndata: [DONE]\n', {
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache",
				},
			})
	),
];
