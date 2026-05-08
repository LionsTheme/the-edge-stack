import { hc } from "hono/client";
import type { AppType } from "@repo/api-types";

export const api = hc<AppType>("/api");
