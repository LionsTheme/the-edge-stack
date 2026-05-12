# 🔒 `apps/api` — Hono API + Better Auth

Type-safe REST API with [Hono](https://hono.dev) deployed on [Cloudflare Workers](https://workers.cloudflare.com). Handles authentication (Better Auth), validation (Zod), and exposes RPC types for typed consumption from the frontend.

## 🏗️ Structure

```
src/
├── index.ts               # Entry point — CORS, auth handler, session middleware
├── routes.ts              # API routes + export AppType for Hono RPC
└── lib/
    └── auth.ts            # Better Auth factory (per-request, Workers-safe)
better-auth.config.ts      # CLI config to regenerate auth schema
wrangler.jsonc             # Cloudflare Workers config
.dev.vars                  # Local environment variables (gitignored)
```

## 🚀 Startup

```bash
pnpm --filter @repo/api dev
```

Available at `http://localhost:8787`.

## 📦 Environment Variables (`.dev.vars`)

| Variable               | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `DATABASE_URL`         | PostgreSQL connection (Neon or local)             |
| `BETTER_AUTH_URL`      | Public API URL (`http://localhost:8787`)         |
| `BETTER_AUTH_SECRET`   | Secret for signing tokens (min 32 chars)         |
| `DASH_URL`             | Frontend URL for CORS and trusted origins        |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID                           |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret                       |

## 🔐 Authentication

Better Auth lives **inside the API**, not in a separate package. It follows the [official Hono + Better Auth integration pattern](https://better-auth.com/docs/integrations/hono).

### Why `createAuth(env)` per request?

Cloudflare Workers isolates I/O between requests. `postgres-js` TCP connections cannot be shared. Creating a new instance per request is the documented solution.

> 📖 [OpenNext: Cannot perform I/O on behalf of a different request](https://opennext.js.org/cloudflare/troubleshooting#error-cannot-perform-io-on-behalf-of-a-different-request)

### Regenerate auth schema

```bash
cd apps/api
pnpm dlx @better-auth/cli@latest generate \
  --config ./better-auth.config.ts \
  --output ../packages/database/src/auth-schema.ts
```

## 🔗 Hono RPC

`routes.ts` exports `AppType` (without Cloudflare bindings) so `@repo/api-types` can re-export it. The Dash consumes types via `hc<AppType>`:

```ts
// Dash: lib/api.ts
import { hc } from "hono/client";
import type { AppType } from "@repo/api-types";
export const api = hc<AppType>("/api");
```

## 📡 Endpoints

| Method | Path             | Description                                         |
| ------ | ---------------- | --------------------------------------------------- |
| `GET`  | `/health`        | Health check                                        |
| `GET`  | `/message?name=` | Demo with Zod validation (typed query params via RPC) |
| `*`    | `/api/auth/*`    | Better Auth (sign-in, callback, session, sign-out)  |

## 🧠 Design Decisions

| Decision                     | Reason                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| Auth in API, not in package  | Follows the [official pattern](https://better-auth.com/docs/integrations/hono); avoids unnecessary abstraction |
| `createAuth()` per-request   | Workers I/O isolation — TCP connections cannot be shared between requests                              |
| `routes.ts` separate from `index.ts` | Separates RPC types (without bindings) from Worker configuration                          |
| Dual DB driver               | Neon (`neon-http`) in production, local PostgreSQL (`postgres-js`) in development                       |
| Zod for validations          | Types inferred automatically via Hono RPC                                                               |