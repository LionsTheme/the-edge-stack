import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@repo/database";

export interface AuthEnv {
  DATABASE_URL: string;
  AUTH_SECRET: string;
  APP_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

export function createAuth(env: AuthEnv) {
  const db = getDb(env.DATABASE_URL);
  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    secret: env.AUTH_SECRET,
    baseURL: env.APP_URL,
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;