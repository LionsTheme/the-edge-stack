import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export { schema };

function isNeon(url: string): boolean {
	return url.includes("neon.tech");
}

export function getDb(databaseUrl: string) {
	if (isNeon(databaseUrl)) {
		const sql = neon(databaseUrl);
		return drizzleNeon({ client: sql, schema });
	}
	const client = postgres(databaseUrl);
	return drizzle({ client, schema });
}

export type Db = ReturnType<typeof getDb>;