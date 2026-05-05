# Cloudflare Workers

## ¿Qué son los Workers?

**Cloudflare Workers** ejecutan código JavaScript/TypeScript en la red edge de Cloudflare (300+ ubicaciones globales):

- **Sin servidores:** No gestionas VMs ni contenedores
- **Rápido:** Cold starts de ~0ms
- **Escalable:** De 0 a millones de requests automáticamente
- **Económico:** 100,000 requests/día gratis

## 🏗️ Workers en The Edge Stack

| Worker | Propósito | URL |
|--------|-----------|-----|
| `apps/api` | API REST con Hono | `/api/*` |
| `apps/gateway` | Enrutamiento unificado | `/` |

## 🔧 Wrangler CLI

Wrangler es la herramienta CLI para Workers:

```bash
# Instalar globalmente
npm install -g wrangler

# Login
wrangler login

# Verificar autenticación
wrangler whoami
```

## ⚙️ wrangler.toml

```toml
name = "the-edge-stack-api"
main = "src/index.ts"
compatibility_date = "2024-04-03"

[vars]
APP_URL = "http://localhost:8787"
```

**Campos importantes:**

| Campo | Descripción |
|-------|-------------|
| `name` | Nombre único del Worker |
| `main` | Entry point del código |
| `compatibility_date` | Fecha de la runtime de Workers |
| `[vars]` | Variables públicas (visibles en código) |

## 🔒 Secrets

Para variables sensibles (contraseñas, tokens):

```bash
# Configurar secret
wrangler secret put DATABASE_URL
# Te pedirá el valor interactivamente

# Listar secrets
wrangler secret list

# Borrar secret
wrangler secret delete DATABASE_URL
```

**Los secrets se inyectan en `c.env`:**

```ts
export default {
  async fetch(req, env, ctx) {
    // env.DATABASE_URL está disponible aquí
    const db = getDb(env.DATABASE_URL);
  }
};
```

## 🚀 Comandos

```bash
# Desarrollo local
wrangler dev

# Desplegar
wrangler deploy

# Logs en tiempo real
wrangler tail

# Ejecutar tests
wrangler vitest-pool-workers
```

## 🌐 Services Bindings

El Gateway usa **Services Bindings** para comunicarse con otros Workers:

```toml
[[services]]
binding = "API"
service = "the-edge-stack-api"
```

```ts
// En el Gateway
export default {
  async fetch(req, env, ctx) {
    return env.API.fetch(req.clone());
  }
};
```

Esto permite:
- Llamadas internas sin HTTP overhead
- Sin problemas de CORS
- Type-safe entre Workers

## 📊 Límites

| Límite | Valor |
|--------|-------|
| CPU time/request | 50ms (free) / 30s (paid) |
| Memoria | 128MB |
| Tamaño del script | 1MB (free) / 5MB (paid) |
| Subrequests | 50/request |
| Requests/día | 100,000 (free) |