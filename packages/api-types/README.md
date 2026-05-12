# 🔗 `@repo/api-types` — Hono RPC Types

Lightweight package that re-exports `AppType` from `apps/api` for typed consumption in frontends via [Hono RPC](https://hono.dev/docs/guides/rpc).

## 📦 Structure

```
src/
└── index.ts    # export type { AppType } from "@repo/api"
```

## 🎯 Purpose

Hono RPC allows the client (Dashboard, etc.) to get autocomplete on all API calls:

```ts
// Dashboard: lib/api.ts
import { hc } from "hono/client";
import type { AppType } from "@repo/api-types";

export const api = hc<AppType>("/api");

// ✅ Autocomplete on routes, query params, body, and response
const res = await api.message.$get({ query: { name: "Hono" } });
//                                   ^? { name?: string | undefined }
// res.json() → { message: string }
```

## 🔄 How It Works

```
apps/api/src/routes.ts ──export type AppType──► @repo/api-types ──► apps/dash
                                                        │
                                                 hc<AppType>("/api")
```

1. `apps/api/src/routes.ts` defines routes with Zod validation and exports `AppType`
2. `apps/api/package.json` has `"exports": { ".": "./src/routes.ts" }` — so `@repo/api` is resolvable
3. `@repo/api-types` re-exports `export type { AppType } from "@repo/api"`
4. The Dashboard imports `AppType` and uses it with `hc<AppType>(url)`

### Why `routes.ts` separate from `index.ts`?

`index.ts` includes `CloudflareBindings` (Worker types). `routes.ts` uses `new Hono()` without bindings, keeping `AppType` portable — frontends don't need to resolve Cloudflare types.

## 📝 Extending

To add new typed routes:

1. Add the endpoint in `apps/api/src/routes.ts` with Zod validation
2. The type is inferred automatically in `AppType`
3. Rebuild: `pnpm --filter @repo/api-types build`