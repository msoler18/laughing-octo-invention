import { expect, test } from "@playwright/test";

test.describe("Creators list", () => {
	test("renders the creators page with table headers", async ({ page }) => {
		await page.goto("/creators");

		await expect(page).toHaveTitle(/RealUp/);
		// Table column headers
		await expect(page.getByRole("columnheader", { name: /Creador/i })).toBeVisible();
		await expect(page.getByRole("columnheader", { name: /Score/i })).toBeVisible();
	});

	test("score column header is clickable for sorting", async ({ page }) => {
		await page.goto("/creators");
		const scoreHeader = page.getByRole("columnheader", { name: /Score/i });
		await expect(scoreHeader).toBeVisible();
		// Should be clickable (cursor-pointer class applied when onSort is wired)
		await scoreHeader.click();
		// After click the URL should reflect sort params
		await expect(page).toHaveURL(/sort_by=score/);
	});
});

test.describe("Chat panel", () => {
	test("floating button is visible on load", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByTitle(/Abrir asistente IA/)).toBeVisible();
	});

	test("opens chat panel on button click", async ({ page }) => {
		await page.goto("/");
		await page.getByTitle(/Abrir asistente IA/).click();
		await expect(page.getByText("Asistente RealUp")).toBeVisible();
		await expect(page.getByText("¿En qué te ayudo?")).toBeVisible();
	});

	test("example query click fills textarea", async ({ page }) => {
		await page.goto("/");
		await page.getByTitle(/Abrir asistente IA/).click();
		const query = "Creadores con más de 50K seguidores en Bogotá";
		await page.getByText(query).click();
		await expect(page.getByPlaceholder(/Escribe tu consulta/)).toHaveValue(query);
	});

	test("Cmd+/ keyboard shortcut toggles panel", async ({ page }) => {
		await page.goto("/");
		// Open
		await page.keyboard.press("Meta+/");
		await expect(page.getByText("Asistente RealUp")).toBeVisible();
		// Close
		await page.keyboard.press("Meta+/");
		await expect(page.getByText("Asistente RealUp")).not.toBeVisible();
	});

	test("closes panel with X button", async ({ page }) => {
		await page.goto("/");
		await page.getByTitle(/Abrir asistente IA/).click();
		await expect(page.getByText("Asistente RealUp")).toBeVisible();
		// X button is the last button in the header
		await page.locator("button[type='button']").filter({ hasText: "" }).last().click();
		await expect(page.getByText("Asistente RealUp")).not.toBeVisible();
	});
});
