import { expect, test } from "@playwright/test";

test.describe("Smoke", () => {
	test("homepage returns 200 and renders the app shell", async ({ page }) => {
		const response = await page.goto("/");

		expect(response?.status()).toBe(200);
		await expect(page).toHaveTitle(/RealUp/);
	});
});
