import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@repo/database";
import { env } from "cloudflare:workers";

/**
 * Derives cross-subdomain cookie configuration automatically from the
 * API and dashboard URLs so the session token is shared correctly.
 *
 * Returns `undefined` when:
 * - Running locally (localhost / 127.0.0.1)
 * - API and dashboard share the same origin (e.g. www.example.com/api + www.example.com/dash)
 *
 * Returns `{ enabled: true, domain }` when API and dashboard are on
 * different subdomains of the same parent domain (e.g. api.example.com + dash.example.com).
 *
 * @see https://better-auth.com/docs/concepts/cookies#cross-subdomain-cookies
 */
function getCrossSubdomainConfig(): BetterAuthOptions["advanced"] {
	const apiUrl = env.BETTER_AUTH_URL;
	const dashUrl = env.DASH_URL;

	// Local development: no cross-subdomain setup required
	if (/localhost|127\.0\.0\.1/.test(apiUrl)) return undefined;

	try {
		const apiHost = new URL(apiUrl).hostname;
		const dashHost = new URL(dashUrl).hostname;

		// Same origin — cookies are already shared
		if (apiHost === dashHost) return undefined;

		// Different subdomains: extract shared parent domain
		// "api.ljrm.workers.dev" → "ljrm.workers.dev"
		// "api.example.com"     → "example.com"
		const parentDomain = apiHost.slice(apiHost.indexOf(".") + 1);
		if (!parentDomain.includes(".")) return undefined; // no parent domain (edge case)

		return {
			crossSubDomainCookies: {
				enabled: true,
				domain: parentDomain,
			},
		};
	} catch {
		return undefined;
	}
}

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
		advanced: getCrossSubdomainConfig(),
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
