import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@repo/database";

export function createAuth(env: {
	DATABASE_URL: string;
	AUTH_SECRET: string;
	APP_URL: string;
	DASHBOARD_URL: string;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
}) {
	const db = getDb(env.DATABASE_URL);
	return betterAuth({
		database: drizzleAdapter(db, { provider: "pg" }),
		secret: env.AUTH_SECRET,
		baseURL: env.APP_URL,
		trustedOrigins: [env.DASHBOARD_URL],
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
