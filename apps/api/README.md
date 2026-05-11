# 🔒 `apps/api` — Hono API + Better Auth

API REST type-safe con [Hono](https://hono.dev) desplegada en [Cloudflare Workers](https://workers.cloudflare.com). Maneja autenticación (Better Auth), validación (Zod) y expone tipos RPC para consumo tipado desde el frontend.

## 🏗️ Estructura

```
src/
├── index.ts               # Entry point — CORS, auth handler, session middleware
├── routes.ts              # Rutas API + export AppType para Hono RPC
└── lib/
    └── auth.ts            # Better Auth factory (per-request, Workers-safe)
better-auth.config.ts      # CLI config para regenerar schema de auth
wrangler.jsonc             # Cloudflare Workers config
.dev.vars                  # Variables de entorno locales (gitignored)
```

## 🚀 Arranque

```bash
pnpm --filter @repo/api dev
```

Accesible en `http://localhost:8787`.

## 📦 Variables de entorno (`.dev.vars`)

| Variable               | Descripción                                     |
| ---------------------- | ----------------------------------------------- |
| `DATABASE_URL`         | Conexión PostgreSQL (Neon o local)              |
| `BETTER_AUTH_URL`      | URL pública de la API (`http://localhost:8787`) |
| `BETTER_AUTH_SECRET`   | Secreto para firmar tokens (min 32 chars)       |
| `DASH_URL`             | URL del frontend para CORS y trusted origins    |
| `GOOGLE_CLIENT_ID`     | Client ID de Google OAuth                       |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth                   |

## 🔐 Autenticación

Better Auth vive **dentro de la API**, no en un paquete separado. Sigue el [patrón oficial de Hono + Better Auth](https://better-auth.com/docs/integrations/hono).

### ¿Por qué `createAuth(env)` por request?

Cloudflare Workers aísla el I/O entre requests. Las conexiones TCP de `postgres-js` no pueden compartirse. Crear una instancia nueva por request es la solución documentada.

> 📖 [OpenNext: Cannot perform I/O on behalf of a different request](https://opennext.js.org/cloudflare/troubleshooting#error-cannot-perform-io-on-behalf-of-a-different-request)

### Regenerar schema de auth

```bash
cd apps/api
pnpm dlx @better-auth/cli@latest generate \
  --config ./better-auth.config.ts \
  --output ../packages/database/src/auth-schema.ts
```

## 🔗 Hono RPC

`routes.ts` exporta `AppType` (sin Cloudflare bindings) para que `@repo/api-types` lo re-exporte. El Dash consume los tipos vía `hc<AppType>`:

```ts
// Dash: lib/api.ts
import { hc } from "hono/client";
import type { AppType } from "@repo/api-types";
export const api = hc<AppType>("/api");
```

## 📡 Endpoints

| Método | Ruta             | Descripción                                            |
| ------ | ---------------- | ------------------------------------------------------ |
| `GET`  | `/health`        | Health check                                           |
| `GET`  | `/message?name=` | Demo con validación Zod (query params tipados vía RPC) |
| `*`    | `/api/auth/*`    | Better Auth (sign-in, callback, session, sign-out)     |

## 🧠 Decisiones de diseño

| Decisión                           | Razón                                                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Auth en API, no en paquete         | Sigue el [patrón oficial](https://better-auth.com/docs/integrations/hono); evita abstracción innecesaria |
| `createAuth()` per-request         | Workers I/O isolation — TCP connections no compartibles entre requests                                   |
| `routes.ts` separado de `index.ts` | Separa tipos RPC (sin bindings) de la configuración del Worker                                           |
| Dual driver DB                     | Neon (`neon-http`) en producción, PostgreSQL local (`postgres-js`) en desarrollo                         |
| Zod en validaciones                | Tipos inferidos automáticamente vía Hono RPC                                                             |
