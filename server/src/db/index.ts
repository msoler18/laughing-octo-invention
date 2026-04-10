import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("Missing required environment variable: DATABASE_URL");
}

// Connection pool — max 10 connections, suitable for Supabase free tier.
// The service-role Supabase client is used for auth-bypassing operations;
// Drizzle connects directly via the pooler URL for transactional queries.
const queryClient = postgres(connectionString, { max: 10 });

export const db = drizzle(queryClient, { schema });

export type Db = typeof db;
