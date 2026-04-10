import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;

if (!url) {
	throw new Error("Missing required environment variable: DATABASE_URL");
}

export default defineConfig({
	// Drizzle schema files — barrel re-exports all table definitions
	schema: "./src/db/schema/index.ts",

	// Output directory for generated SQL migrations
	out: "../supabase/migrations",

	dialect: "postgresql",

	dbCredentials: { url },

	// Verbose output in migration generation
	verbose: true,
	strict: true,
});
