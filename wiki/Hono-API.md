# Hono API

## ¿Qué es Hono?

**Hono** (炎, "llama" en japonés) es un framework web ultraligero para el edge:

- **Rápido:** ~10x más rápido que Express en algunos benchmarks
- **Pequeño:** ~14KB sin dependencias
- **Type-safe:** Soporta TypeScript nativo
- **Edge-ready:** Funciona en Cloudflare Workers, Deno, Bun, Node.js

## 🏗️ Arquitectura

```
Cliente ──Hono RPC──→ API Worker ──Drizzle──→ Neon DB
                        │
                        └── Better Auth
```

## 📐 Estructura Básica

```ts
import { Hono } from "hono";

const app = new Hono();

// Middleware
app.use("/*", cors());

// Rutas
app.get("/api/health", (c) => c.json({ status: "ok" }));

// Route groups
const api = app.basePath("/api");
api.get("/users", handler);
api.post("/users", handler);

export default app;
```

## 🔄 Hono RPC (Type-Safe)

La característica más poderosa de Hono para este stack es **RPC**, que permite compartir tipos entre backend y frontend.

### Definir la API

```ts
// apps/api/src/index.ts
import { Hono } from "hono";

const app = new Hono().basePath("/api");

const route = app
  .get("/me", async (c) => {
    return c.json({ user: { id: "1", name: "John" } });
  })
  .get("/posts", async (c) => {
    return c.json({ posts: [] });
  });

export type AppType = typeof route;
export default app;
```

### Consumir desde el Frontend

```ts
// apps/dashboard/src/lib/api.ts
import { hc } from "hono/client";
import type { AppType } from "@repo/api";

const api = hc<AppType>("/api");

// ¡Totalmente tipado!
const { data } = await api.api.me.$get();
// data: { user: { id: string; name: string } }
```

**Ventajas:**
- ✅ Autocompletado en el IDE
- ✅ Type checking en build time
- ✅ Si cambia la API, el frontend falla en compilación

---

## 🔐 Integración con Better Auth

```ts
app.use("/api/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

app.get("/api/me", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  return c.json({ user: session?.user ?? null });
});
```

---

## 🧪 Testing

```ts
// apps/api/src/index.test.ts
import { testClient } from "hono/testing";
import app from "./index";

describe("API", () => {
  it("returns health check", async () => {
    const client = testClient(app);
    const res = await client.api.health.$get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
```

---

## 🚀 Despliegue

```bash
cd apps/api
wrangler deploy
```

La API estará disponible en `https://the-edge-stack-api.tu-subdominio.workers.dev`