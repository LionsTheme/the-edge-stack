import { hc } from "hono/client";
import type { AppType } from "@repo/api";

/**
 * Type-safe Hono RPC client.
 *
 * Usage:
 *   const { data } = await api.api.posts.$get();
 *   const { data } = await api.api.me.$get();
 *
 * Full autocompletion and compile-time type checking.
 */
export const api = hc<AppType>(typeof window !== "undefined" ? "/api" : "http://localhost:8787/api");