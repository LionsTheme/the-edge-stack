import { hc } from "hono/client";
import type { AppType } from "@repo/api-types";

/**
 * API base URL for the Hono RPC client.
 *
 * Defaults to "/api" in dev (works with Vite proxy / Gateway).
 * Uses VITE_API_URL in production for direct cross-worker calls.
 */
const apiUrl = import.meta.env.VITE_API_URL?.trim() || "/api";

export const api = hc<AppType>(apiUrl);
