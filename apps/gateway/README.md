# 🚪 `apps/gateway` — Cloudflare Gateway Worker

Router unificado que dirige el tráfico a los servicios correctos usando [Cloudflare Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/). Es el punto de entrada único para todas las apps del monorepo.

## 🏗️ Estructura

```
src/
└── index.ts    # Router + security headers + structured logging
wrangler.jsonc  # Service bindings a API, Dash, Blog, Landing, Docs
```

## 🚀 Arranque

```bash
pnpm --filter @repo/gateway dev
```

> **Nota:** El gateway depende de los service bindings. En desarrollo local, cada servicio debe estar corriendo en su propio `wrangler dev` para que el gateway pueda enrutar hacia ellos.

## 🗺️ Tabla de ruteo

| Path | Servicio | Binding |
|---|---|---|
| `/api/*` | API (Hono) | `env.API` |
| `/dash/*` | Dash (TanStack Start) | `env.DASH` |
| `/blog/*` | Blog (Astro) | `env.BLOG` |
| `/docs/*` | Docs (Starlight) | `env.DOCS` |
| `/*` | Landing (Astro) | `env.LANDING` (fallback) |

El orden es importante: las rutas específicas van primero, el fallback (`/*`) al final.

## 🔒 Security headers

El gateway agrega headers de seguridad a todas las respuestas:

| Header | Valor |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

## 📊 Structured logging

Cada request se loguea en formato JSON:

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

En caso de error (el servicio no responde), el gateway devuelve `502 Bad Gateway` con un cuerpo JSON.

## 🔗 Service Bindings

Los bindings se configuran en `wrangler.jsonc`:

```jsonc
{
  "services": [
    { "binding": "API", "service": "api" },
    { "binding": "DASH", "service": "dash" }
    // ...
  ]
}
```

**En producción** los nombres de servicio deben coincidir con los nombres de los Workers desplegados en Cloudflare.

**En desarrollo local** se necesita un `wrangler.jsonc` local o usar `wrangler dev --experimental-local`.

## 🎯 Ventajas del patrón Gateway

| Ventaja | Descripción |
|---|---|
| **Dominio único** | Todas las apps bajo un mismo dominio — sin CORS entre ellas |
| **Routing centralizado** | Cambios de ruta en un solo lugar |
| **Security headers** | Aplicados consistentemente a todas las respuestas |
| **Logging unificado** | Todas las requests pasan por el mismo pipeline de logs |
| **Cero latencia entre servicios** | Service bindings de Workers tienen latencia sub-milisegundo |
