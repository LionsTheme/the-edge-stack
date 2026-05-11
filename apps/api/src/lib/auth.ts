import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@repo/database";
import { env } from "cloudflare:workers";

/**
 * Creates a new Better Auth instance configured for the current environment.
 *
 * Must be called per-request in Cloudflare Workers due to I/O isolation —
 * TCP connections from postgres-js cannot be shared across requests.
 * @see https://opennext.js.org/cloudflare/troubleshooting#error-cannot-perform-io-on-behalf-of-a-different-request
 * @see https://better-auth.com/docs/integrations/hono
 *
 * Uses `env` from cloudflare:workers for global access to environment variables
 * without passing them through every function call.
 */
export function createAuth() {
	const db = getDb(env.DATABASE_URL);
	return betterAuth({
		database: drizzleAdapter(db, { provider: "pg" }),
		basePath: "/api/auth",
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: [env.DASH_URL],
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
			},
		},
	});
}

export type Auth = ReturnType<typeof createAuth>;

// Session types for Hono context variables, following the official pattern:
// https://better-auth.com/docs/integrations/hono#middleware
export type SessionUser = ReturnType<typeof createAuth> extends {
	$Infer: { Session: { user: infer U } };
}
	? U
	: never;
export type SessionData = ReturnType<typeof createAuth> extends {
	$Infer: { Session: { session: infer S } };
}
	? S
	: never;
