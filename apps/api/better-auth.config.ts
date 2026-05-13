/// <reference types="node" />

/**
 * Better Auth CLI configuration file
 * Used to regenerate the Drizzle schema for auth tables.
 *
 * Docs: https://www.better-auth.com/docs/concepts/cli
 * Example: https://hono.dev/examples/better-auth-on-cloudflare#_2-better-auth-schema
 *
 * Usage: pnpm dlx @better-auth/cli@latest generate --config ./better-auth.config.ts --output ./src/db/auth-schema.ts
 */
import { getDb, schema } from "@repo/database";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL is required");
}
const db = getDb(databaseUrl);

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg", schema }),
	baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8787",
	secret: process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me",
});
