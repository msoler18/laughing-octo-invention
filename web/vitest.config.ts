import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		// Native tsconfig paths resolution (Vitest v4 / Vite v6)
		tsconfigPaths: true,
	},
	test: {
		// jsdom simulates the browser DOM for React component tests
		environment: "jsdom",

		// Expose Vitest globals (describe, it, expect) so @testing-library/jest-dom works
		globals: true,

		// Auto-import @testing-library/jest-dom matchers (toBeInTheDocument, etc.)
		setupFiles: ["./src/test/setup.ts"],

		// Only unit/integration tests — E2E runs via Playwright
		include: ["**/*.{test,spec}.{ts,tsx}"],
		exclude: ["**/e2e/**", "**/node_modules/**", "**/.next/**"],

		// Don't fail the suite when no test files exist yet (before M1)
		passWithNoTests: true,

		// Coverage via v8 (built-in, no extra deps)
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov"],
			exclude: ["node_modules/**", "**/*.config.*", "**/e2e/**", "src/test/**", "src/mocks/**"],
		},
	},
});
