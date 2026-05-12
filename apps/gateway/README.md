# 🚪 `apps/gateway` — Cloudflare Gateway Worker (VMFE Router)

Router Worker implementing [Cloudflare vertical microfrontends](https://developers.cloudflare.com/workers/framework-guides/web-apps/microfrontends/) pattern. It's the single entry point for all apps in the monorepo, using [Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/) for zero-latency internal communication.

## 🏗️ Structure

```
src/
├── index.ts      # Entry point + pipeline orchestration
├── router.ts     # ROUTES parsing, path matching, path stripping
├── rewriter.ts   # HTMLRewriter, CSS rewriter, headers, View Transitions, Speculation Rules
├── types.ts      # Env, BindingKey, RouteConfig
wrangler.jsonc    # Service bindings + ROUTES + ASSET_PREFIXES + env vars
```

## 🔄 Gateway Pipeline

```
Request
  → parseRoutes(ROUTES env var)
  → matchRoute(pathname)
  → validateBinding (503 if not found)
  → stripPath (/docs/installation → /installation)
  → fetcher.fetch(stripped)
  → response.ok?
      → rewriteResponse   (HTMLRewriter + CSS streaming)
      → rewriteHeaders    (Location + Set-Cookie)
      → injectOptimizations (View Transitions + Speculation Rules)
  → withSecurityHeaders
  → Response
```

## 🚀 Startup

```bash
pnpm --filter @repo/gateway dev
```

> **Note:** The gateway depends on service bindings. In local development, each Worker (`api`, `dash`, `blog`, `landing`, `docs`) must be running in its own `wrangler dev`.

## 🗺️ Routing Table

| Path | Worker | Binding |
|---|---|---|
| `/api/*` | API (Hono) | `env.API` |
| `/dash/*` | Dash (TanStack Start) | `env.DASH` |
| `/blog/*` | Blog (Astro) | `env.BLOG` |
| `/docs/*` | Docs (Starlight) | `env.DOCS` |
| `/*` | Landing (Astro) | `env.LANDING` (fallback) |

Routing is **data-driven**: the `ROUTES` variable in `wrangler.jsonc` defines the mapping. To add an app, only that variable needs to be modified, without touching code.

## ✨ Features

### Path stripping
`/docs/installation` → the Docs Worker receives `/installation`. Each microfrontend works as if it were at its own root.

### HTML + CSS rewriting
`HTMLRewriter` rewrites `href`, `src`, `poster`, `action`, `srcset`, `data-*`, and `astro-component-url` to include the route prefix. CSS `url()` is also rewritten with streaming (no buffering).

### Header rewriting
- **`Location`**: relative redirects receive the prefix (`/login` → `/dash/login`)
- **`Set-Cookie`**: cookie paths adjusted to the mount prefix

### View Transitions
CSS injected in `<head>` for smooth transitions between microfrontends (configurable via `ENABLE_VIEW_TRANSITIONS` env var).

### Speculation Rules
`<script type="speculationrules">` with URLs to preload for instant navigation (routes with `preload: true` in `ROUTES`).

## ⚙️ Environment Variables

| Variable | Description | Default |
|---|---|---|
| `ROUTES` | JSON with route-to-binding mapping | Required |
| `ASSET_PREFIXES` | JSON array of asset prefixes to rewrite | `["/assets/", "/static/", "/build/", "/_astro/", "/_vite/", "/fonts/"]` |
| `ENABLE_VIEW_TRANSITIONS` | Activates View Transitions CSS | `true` |

## 🔒 Security Headers

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

## 📊 Logging

Structured logging in JSON format:

```json
{
  "level": "info",
  "method": "GET",
  "path": "/api/health",
  "status": 200,
  "duration_ms": 12,
  "timestamp": "2026-05-09T10:00:00.000Z"
}
```

Errors: `502 Bad Gateway` (service not responding), `503 Service Unavailable` (binding not found).

## 🔗 Service Bindings

```jsonc
{
  "services": [
    { "binding": "API", "service": "api" },
    { "binding": "DASH", "service": "dash" },
    { "binding": "BLOG", "service": "blog" },
    { "binding": "LANDING", "service": "landing" },
    { "binding": "DOCS", "service": "docs" }
  ]
}
```

**The `service` names must match exactly with `name` in each Worker's `wrangler.jsonc`.**