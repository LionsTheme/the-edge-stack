# 🧠 Buenas Prácticas — Hono API

Guía de referencia para el desarrollo de la API con Hono en este monorepo. Basada en la [documentación oficial de Hono](https://hono.dev/docs/guides/best-practices), [guías de DeployHQ](https://www.deployhq.com/guides/hono), [FreeCodeCamp](https://www.freecodecamp.org/news/build-production-ready-web-apps-with-hono/) y experiencia práctica con el stack.

---

## 📐 Estructura de proyecto

### Layout recomendado

```
src/
├── index.ts         # Entry point del Worker — runtime-specific
├── app.ts           # App Hono exportable (runtime-agnostic)
├── routes/          # Rutas agrupadas por recurso
│   ├── health.ts
│   ├── posts.ts
│   └── users.ts
├── middleware/      # Middleware reutilizable
│   ├── auth.ts
│   ├── error.ts
│   └── logging.ts
├── validators/     # Schemas Zod (compartibles vía RPC)
│   ├── posts.ts
│   └── users.ts
├── services/       # Lógica de negocio (runtime-agnostic)
│   ├── posts.ts
│   └── users.ts
└── lib/
    ├── auth.ts     # Better Auth factory
    └── db.ts       # Database client
```

### ¿Qué ya tenemos?

| Archivo | Estado | Nota |
|---------|--------|------|
| `src/index.ts` | ✅ Existe | Entry point del Worker |
| `src/routes.ts` | ✅ Existe | Exporta `AppType` |
| `src/lib/auth.ts` | ✅ Existe | Better Auth factory |
| `src/validators/` | ❌ No existe | Schemas inline en `routes.ts` |
| `src/middleware/` | ❌ No existe | Middleware inline en `index.ts` y `routes.ts` |
| `src/services/` | ❌ No existe | Lógica de negocio en handlers |

> **Recomendación:** Migrar validators a `src/validators/` y extraer lógica de negocio a `src/services/` a medida que la API crezca.

---

## 🧩 Middleware

### Stack de seguridad recomendado

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import { timeout } from "hono/timeout";
import { logger } from "hono/logger";
import { timing } from "hono/timing";

const app = new Hono();

app.use("*", timing());        // Server-Timing header
app.use("*", logger());        // Request logging
app.use("*", secureHeaders()); // CSP, HSTS, X-Frame-Options, etc.
app.use("/api/*", bodyLimit({ maxSize: 1024 * 1024 })); // 1MB max
app.use("/api/*", timeout(15_000)); // 15s timeout
app.use("/api/*", cors({ origin: ["https://dominio.com"], credentials: true }));
app.use("/api/*", csrf({ origin: "dominio.com" }));
```

### Middleware personalizado con `createMiddleware()`

Usar `createMiddleware()` de `hono/factory` para middleware reutilizable y con tipado seguro:

```ts
import { createMiddleware } from "hono/factory";

export const auditMiddleware = createMiddleware<{
  Variables: { requestId: string };
}>(async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);
  await next();
  console.log(`[${requestId}] ${c.res.status}`);
});
```

### Tipado acumulativo

El tipado de `c.var` se acumula al encadenar `.use()`:

```ts
new Hono()
  .use(authMiddleware)    // Añade c.var.user
  .use(dbMiddleware)      // Añade c.var.db
  .get("/", (c) => {
    c.var.user; // ✅ disponible
    c.var.db;   // ✅ disponible
  });
```

---

## ✅ Validación con Zod

### Patrón recomendado

Separar schemas en `src/validators/`:

```ts
// src/validators/posts.ts
import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  published: z.boolean().default(false),
  tags: z.array(z.string()).max(10).optional(),
});

export const listPostsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

Usarlos en rutas con `zValidator`:

```ts
import { zValidator } from "@hono/zod-validator";
import { createPostSchema, listPostsQuery } from "../validators/posts";

export const posts = new Hono()
  .get("/", zValidator("query", listPostsQuery), async (c) => {
    const { page, limit } = c.req.valid("query"); // ✅ tipado
    return c.json({ page, limit });
  })
  .post("/", zValidator("json", createPostSchema), async (c) => {
    const body = c.req.valid("json"); // ✅ tipado
    return c.json(body, 201);
  });
```

### `z.coerce` para query params

Los query params siempre llegan como strings. Usar `z.coerce.number()` para convertir:

```ts
const listPostsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
});
```

### Alternativas más ligeras para Workers

Zod pesa ~13KB gzip. Para Workers con presupuesto ajustado:

| Librería | Tamaño | Uso |
|----------|--------|-----|
| Valibot | ~1.5KB | `@hono/valibot-validator` |
| TypeBox | ~3KB | `@hono/typebox-validator` (genera JSON Schema) |
| ArkType | ~5KB | `@hono/arktype-validator` |

---

## 🔗 RPC (tipado extremo a extremo)

### Reglas clave

| Regla | Explicación |
|-------|-------------|
| ✅ `c.json()` con status code explícito | `c.json({ error }, 404)` — el cliente infiere el tipo por status |
| ❌ `c.notFound()` | No se infiere el tipo en el cliente. Usar `c.json({ error }, 404)` |
| ❌ Errores de `app.onError()` | No se infieren automáticamente. Usar `ApplyGlobalResponse` |
| ⚠️ `strict: true` en tsconfig | Obligatorio tanto en server como en cliente |

### Cubrir errores globales con `ApplyGlobalResponse`

```ts
import type { ApplyGlobalResponse } from "hono/client";

type AppWithErrors = ApplyGlobalResponse<
  typeof app,
  { 500: { json: { error: string } } }
>;

const client = hc<AppWithErrors>("/api");
// Ahora InferResponseType incluye { error: string }
```

### Cookies en el RPC client

```ts
const client = hc<AppType>("/api", {
  init: { credentials: "include" },
});
```

Esto envía cookies en cada request — necesario para sesiones de Better Auth.

---

## ⚠️ Manejo de errores

### Global error handler

```ts
import { HTTPException } from "hono/http-exception";

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  console.error("Unhandled error:", err);
  return c.json(
    { error: "Internal server error", message: err.message },
    500,
  );
});
```

### Not Found handler

```ts
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});
```

> Combinado con `ApplyGlobalResponse` para que el cliente infiera estos tipos.

---

## 📁 Rutas con `app.route()`

Para organizar la API por recurso:

```ts
// src/routes/health.ts
import { Hono } from "hono";

const health = new Hono()
  .get("/", (c) => c.json({ status: "ok" }))
  .get("/db", (c) => c.json({ db: "connected" }));

export default health;
export type AppType = typeof health;

// src/routes/posts.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createPostSchema } from "../validators/posts";

const posts = new Hono()
  .get("/", /* ... */)
  .post("/", zValidator("json", createPostSchema), /* ... */);

export default posts;
export type AppType = typeof posts;
```

Montarlas en `index.ts`:

```ts
import health from "./routes/health";
import posts from "./routes/posts";

app.route("/health", health);
app.route("/api/posts", posts);
```

### Para RPC funcione con múltiples routers

```ts
// routes.ts — agregador de tipos
import health from "./routes/health";
import posts from "./routes/posts";

const app = new Hono()
  .route("/health", health)
  .route("/api/posts", posts);

export default app;
export type AppType = typeof app;
```

---

## 🧪 Testing

Hono permite testear sin levantar servidor usando `app.request()`:

```ts
import { app } from "../src/app";

it("GET /health returns ok", async () => {
  const res = await app.request("/health");
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});

it("GET /message with query param", async () => {
  const res = await app.request("/message?name=Test");
  const data = await res.json();
  expect(data.message).toBe("Hello Test!");
});
```

Esto funciona porque `app.fetch` es una función pura que recibe `Request` y devuelve `Response`.

---

## 🏗️ Decisiones de diseño aplicadas

| Decisión | Por qué |
|----------|---------|
| `routes.ts` separado de `index.ts` | `AppType` no incluye bindings de Cloudflare, portable para frontends |
| Per-request `createAuth()` | Workers aísla I/O entre requests — las conexiones TCP no se comparten |
| CORS dinámico | `origin` callback permite desarrollo local + producción sin cambiar código |
| Gateway unificado | Un solo dominio evita problemas de CORS y cookies entre subdominios |

---

## 📚 Referencias

- [Hono Best Practices](https://hono.dev/docs/guides/best-practices)
- [Hono RPC](https://hono.dev/docs/guides/rpc)
- [Hono Middleware](https://hono.dev/docs/guides/middleware)
- [Hono Validation](https://hono.dev/docs/guides/validation)
- [Hono Error Handling](https://hono.dev/examples/validator-error-handling)
- [DeployHQ: Learn Hono](https://www.deployhq.com/guides/hono)
- [FreeCodeCamp: Production-ready Hono](https://www.freecodecamp.org/news/build-production-ready-web-apps-with-hono/)
- [Hacking Hono: Validation Middleware](https://fiberplane.com/blog/hono-validation-middleware/)
