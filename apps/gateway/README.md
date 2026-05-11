# 🚪 `apps/gateway` — Cloudflare Gateway Worker (VMFE Router)

Router Worker que implementa el patrón de [microfrontends verticales](https://developers.cloudflare.com/workers/framework-guides/web-apps/microfrontends/) de Cloudflare. Es el punto de entrada único para todas las apps del monorepo, usando [Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/) para comunicación interna de cero latencia.

## 🏗️ Estructura

```
src/
├── index.ts      # Entry point + pipeline orchestration
├── router.ts     # ROUTES parsing, path matching, path stripping
├── rewriter.ts   # HTMLRewriter, CSS rewriter, headers, View Transitions, Speculation Rules
├── types.ts      # Env, BindingKey, RouteConfig
wrangler.jsonc    # Service bindings + ROUTES + ASSET_PREFIXES + env vars
```

## 🔄 Pipeline del Gateway

```
Request
  → parseRoutes(ROUTES env var)
  → matchRoute(pathname)
  → validateBinding (503 si no existe)
  → stripPath (/docs/instalacion → /instalacion)
  → fetcher.fetch(stripped)
  → response.ok?
      → rewriteResponse   (HTMLRewriter + CSS streaming)
      → rewriteHeaders    (Location + Set-Cookie)
      → injectOptimizations (View Transitions + Speculation Rules)
  → withSecurityHeaders
  → Response
```

## 🚀 Arranque

```bash
pnpm --filter @repo/gateway dev
```

> **Nota:** El gateway depende de los service bindings. En desarrollo local, cada Worker (`api`, `dash`, `blog`, `landing`, `docs`) debe estar corriendo en su propio `wrangler dev`.

## 🗺️ Tabla de ruteo

| Path | Worker | Binding |
|---|---|---|
| `/api/*` | API (Hono) | `env.API` |
| `/dash/*` | Dash (TanStack Start) | `env.DASH` |
| `/blog/*` | Blog (Astro) | `env.BLOG` |
| `/docs/*` | Docs (Starlight) | `env.DOCS` |
| `/*` | Landing (Astro) | `env.LANDING` (fallback) |

El ruteo es **data-driven**: la variable `ROUTES` en `wrangler.jsonc` define el mapeo. Para agregar una app, solo se modifica esa variable, sin tocar código.

## ✨ Features

### Path stripping
`/docs/instalacion` → el Worker de Docs recibe `/instalacion`. Cada microfrontend funciona como si estuviera en su propia raíz.

### HTML + CSS rewriting
`HTMLRewriter` reescribe `href`, `src`, `poster`, `action`, `srcset`, `data-*`, y `astro-component-url` para incluir el prefijo de ruta. CSS `url()` también se reescribe con streaming (sin buffering).

### Header rewriting
- **`Location`**: redirects relativos reciben el prefijo (`/login` → `/dash/login`)
- **`Set-Cookie`**: paths de cookies ajustados al prefijo de montaje

### View Transitions
CSS inyectado en `<head>` para transiciones suaves entre microfrontends (configurable vía `ENABLE_VIEW_TRANSITIONS` env var).

### Speculation Rules
`<script type="speculationrules">` con URLs a precargar para navegación instantánea (rutas con `preload: true` en `ROUTES`).

## ⚙️ Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `ROUTES` | JSON con mapeo de rutas a bindings | Requerido |
| `ASSET_PREFIXES` | JSON array de prefijos de assets a reescribir | `["/assets/", "/static/", "/build/", "/_astro/", "/_vite/", "/fonts/"]` |
| `ENABLE_VIEW_TRANSITIONS` | Activa CSS de View Transitions | `true` |

## 🔒 Security headers

| Header | Valor |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

## 📊 Logging

Structured logging en formato JSON:

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

Errores: `502 Bad Gateway` (servicio no responde), `503 Service Unavailable` (binding no encontrado).

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

**Los nombres de `service` deben coincidir exactamente con `name` en el `wrangler.jsonc` de cada Worker.**
