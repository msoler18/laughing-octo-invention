import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScoreBadge, scoreGrade } from "./score-badge";

// ── scoreGrade unit ───────────────────────────────────────────────────────────

describe("scoreGrade", () => {
	it("returns A for score >= 75", () => {
		expect(scoreGrade(75)).toBe("A");
		expect(scoreGrade(100)).toBe("A");
	});

	it("returns B for 50–74", () => {
		expect(scoreGrade(50)).toBe("B");
		expect(scoreGrade(74)).toBe("B");
	});

	it("returns C for 25–49", () => {
		expect(scoreGrade(25)).toBe("C");
		expect(scoreGrade(49)).toBe("C");
	});

	it("returns D for < 25", () => {
		expect(scoreGrade(0)).toBe("D");
		expect(scoreGrade(24)).toBe("D");
	});
});

// ── ScoreBadge rendering ──────────────────────────────────────────────────────

describe("ScoreBadge", () => {
	it("renders dash when score is null", () => {
		render(<ScoreBadge score={null} />);
		expect(screen.getByText("—")).toBeInTheDocument();
	});

	it("shows grade letter and numeric value for an A score", () => {
		render(<ScoreBadge score="80" />);
		expect(screen.getByText("A")).toBeInTheDocument();
		expect(screen.getByText("80")).toBeInTheDocument();
	});

	it("shows B grade for score 60", () => {
		render(<ScoreBadge score="60" />);
		expect(screen.getByText("B")).toBeInTheDocument();
	});

	it("shows C grade for score 30", () => {
		render(<ScoreBadge score="30" />);
		expect(screen.getByText("C")).toBeInTheDocument();
	});

	it("shows D grade for score 10", () => {
		render(<ScoreBadge score="10" />);
		expect(screen.getByText("D")).toBeInTheDocument();
	});

	it("applies emerald color class for grade A", () => {
		const { container } = render(<ScoreBadge score="80" />);
		expect(container.firstChild).toHaveClass("text-emerald-400");
	});

	it("applies red color class for grade D", () => {
		const { container } = render(<ScoreBadge score="10" />);
		expect(container.firstChild).toHaveClass("text-red-400");
	});
});
