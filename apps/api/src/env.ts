import { z } from "zod";

/**
 * Runtime validation of Cloudflare Worker environment variables.
 *
 * This ensures that all required secrets and variables are present
 * before the Worker starts handling requests.
 */
export const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  APP_URL: z.string().url("APP_URL must be a valid URL"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables at runtime.
 * Call this at the start of your Worker handler.
 */
export function validateEnv(env: Record<string, unknown>): Env {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment variables: ${errors}`);
  }
  return result.data;
}