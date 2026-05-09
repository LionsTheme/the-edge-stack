# 🔗 `@repo/api-types` — Hono RPC Types

Paquete ligero que re-exporta `AppType` desde `apps/api` para consumo tipado en frontends vía [Hono RPC](https://hono.dev/docs/guides/rpc).

## 📦 Estructura

```
src/
└── index.ts    # export type { AppType } from "@repo/api"
```

## 🎯 Propósito

Hono RPC permite que el cliente (Dashboard, etc.) obtenga autocompletado en todas las llamadas al API:

```ts
// Dashboard: lib/api.ts
import { hc } from "hono/client";
import type { AppType } from "@repo/api-types";

export const api = hc<AppType>("/api");

// ✅ Autocompletado en rutas, query params, body y respuesta
const res = await api.message.$get({ query: { name: "Hono" } });
//                                   ^? { name?: string | undefined }
// res.json() → { message: string }
```

## 🔄 Cómo funciona

```
apps/api/src/routes.ts ──export type AppType──► @repo/api-types ──► apps/dashboard
                                                        │
                                                 hc<AppType>("/api")
```

1. `apps/api/src/routes.ts` define las rutas con Zod validation y exporta `AppType`
2. `apps/api/package.json` tiene `"exports": { ".": "./src/routes.ts" }` — así `@repo/api` es resoluble
3. `@repo/api-types` re-exporta `export type { AppType } from "@repo/api"`
4. El Dashboard importa `AppType` y lo usa con `hc<AppType>(url)`

### ¿Por qué `routes.ts` separado de `index.ts`?

`index.ts` incluye `CloudflareBindings` (tipos de Workers). `routes.ts` usa `new Hono()` sin bindings, manteniendo `AppType` portable — los frontends no necesitan resolver tipos de Cloudflare.

## 📝 Extender

Para agregar nuevas rutas tipadas:

1. Agregá el endpoint en `apps/api/src/routes.ts` con validación Zod
2. El tipo se infiere automáticamente en `AppType`
3. Rebuild: `pnpm --filter @repo/api-types build`
