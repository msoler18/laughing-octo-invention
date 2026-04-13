import { describe, expect, it } from "vitest";

// ── Inline copy of the pure function under test ───────────────────────────────
// Importing from chat-messages.tsx would pull in React + "use client" globals.
// This thin copy keeps the test pure Node / no-DOM.

interface CreatorCard {
	id: string;
	instagramHandle: string;
	fullName: string;
	city: string | null;
}

function extractCreators(output: unknown): CreatorCard[] | null {
	if (!output || typeof output !== "object") return null;
	const o = output as Record<string, unknown>;
	if (Array.isArray(o.results)) return (o.results as CreatorCard[]).filter((r) => r.id);
	if (Array.isArray(o.similar)) return (o.similar as CreatorCard[]).filter((r) => r.id);
	return null;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

const creator = {
	id: "abc",
	instagramHandle: "test",
	fullName: "Test Creator",
	city: "Bogotá",
};

describe("extractCreators", () => {
	it("returns null for null input", () => {
		expect(extractCreators(null)).toBeNull();
	});

	it("returns null for non-object input", () => {
		expect(extractCreators("string")).toBeNull();
		expect(extractCreators(42)).toBeNull();
	});

	it("returns null when output has no results or similar key", () => {
		expect(extractCreators({})).toBeNull();
		expect(extractCreators({ other: [] })).toBeNull();
	});

	it("extracts from results array (searchCreators output)", () => {
		const output = { results: [creator], total: 1 };
		expect(extractCreators(output)).toEqual([creator]);
	});

	it("extracts from similar array (findSimilarCreators output)", () => {
		const output = { referenceCreator: {}, similar: [creator] };
		expect(extractCreators(output)).toEqual([creator]);
	});

	it("filters out entries without id", () => {
		const noId = { instagramHandle: "x", fullName: "X", city: null };
		const output = { results: [creator, noId] };
		expect(extractCreators(output)).toEqual([creator]);
	});

	it("returns empty array when results is an empty array", () => {
		expect(extractCreators({ results: [] })).toEqual([]);
	});

	it("prefers results over similar when both are present", () => {
		const other = { id: "other", instagramHandle: "o", fullName: "Other", city: null };
		const output = { results: [creator], similar: [other] };
		// results takes precedence because Array.isArray(o.results) is checked first
		expect(extractCreators(output)).toEqual([creator]);
	});
});
