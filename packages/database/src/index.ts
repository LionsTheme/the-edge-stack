import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export { schema };

function isNeon(url: string): boolean {
	return url.includes("neon.tech");
}

/**
 * Returns a Drizzle ORM instance with the appropriate driver.
 *
 * Auto-detects the database type from the connection URL:
 * - Neon (`neon.tech` in URL): uses `@neondatabase/serverless` (HTTP/WebSocket, Workers-safe)
 * - Local PostgreSQL: uses `postgres-js` (TCP, Node.js only — not Workers-compatible)
 *
 * @param databaseUrl - PostgreSQL connection string (e.g. `postgresql://...`)
 */
export function getDb(databaseUrl: string) {
	if (isNeon(databaseUrl)) {
		const sql = neon(databaseUrl);
		return drizzleNeon({ client: sql, schema });
	}
	const client = postgres(databaseUrl);
	return drizzle({ client, schema });
}

export type Db = ReturnType<typeof getDb>;