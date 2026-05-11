# 🖥️ `apps/dash` — TanStack Start

Dash SSR con [TanStack Start](https://tanstack.com/start) + [React 19](https://react.dev). Autenticación con Google OAuth, rutas protegidas y consumo tipado del API vía Hono RPC.

## 🏗️ Estructura

```
src/
├── routes/
│   ├── __root.tsx              # Layout raíz (head, estilos, devtools)
│   ├── index.tsx               # Home pública — muestra sesión si existe
│   ├── sign-in.tsx             # Sign-in con Google OAuth
│   ├── _protected.tsx          # Layout protegido — beforeLoad verifica sesión
│   └── _protected/
│       └── dashboard.tsx       # Dash — muestra usuario, botón sign-out
├── lib/
│   ├── api.ts                  # Cliente Hono RPC (hc<AppType>)
│   ├── auth-client.ts          # Cliente Better Auth React
│   └── auth.functions.ts       # Server function para verificar sesión en SSR
├── router.tsx                  # Configuración de TanStack Router
├── routeTree.gen.ts            # Árbol de rutas autogenerado
└── styles.css                  # Tailwind CSS + tokens
vite.config.ts                  # Vite + Cloudflare plugin + TanStack Start
```

## 🚀 Arranque

```bash
pnpm --filter @repo/dash dev
```

Accesible en `http://localhost:3000`.

## 🔐 Flujo de autenticación

```
Usuario → /sign-in → Google OAuth → API callback → cookie de sesión
                                                         ↓
                                               redirect a /dash
                                                         ↓
                                        _protected.tsx verifica sesión (SSR)
```

### Client-side

```ts
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
export const { signIn, signOut, useSession } = authClient;
```

### SSR (server function)

```ts
// lib/auth.functions.ts
export const getSession = createServerFn().handler(async () => {
  const request = getRequest();                    // Request original
  const cookie = request.headers.get("cookie");    // Forward de cookies
  const res = await fetch(`${apiUrl}/api/auth/get-session`, { headers: { cookie } });
  // ...
});
```

La server function usa `getRequest()` de TanStack Start para acceder a los headers del request original, forwardea la cookie al API, y devuelve la sesión validada.

### Rutas protegidas

El layout `_protected.tsx` ejecuta `beforeLoad` → `getSession()`. Si no hay sesión, redirige a `/sign-in`. Las rutas hijas reciben `{ user }` en el contexto.

## 🔗 Hono RPC

Cliente tipado vía `@repo/api-types`:

```ts
// lib/api.ts
import { hc } from "hono/client";
import type { AppType } from "@repo/api-types";
export const api = hc<AppType>("/api");

// Autocompletado en .$get(), query params y respuesta
const res = await api.message.$get({ query: { name: "Hono" } });
```

## 📦 Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL del API (default: `http://localhost:8787`) |

## 🧠 Decisiones de diseño

| Decisión | Razón |
|---|---|
| Server function forwardea cookies al API | El Dashboard no tiene acceso directo a Better Auth — la API es single source of truth |
| `getRequest()` en lugar de `getRequestHeaders()` | API estable de TanStack Start; devuelve un objeto Request estándar |
| `window.location.origin` para callbackURL | Resuelve dinámicamente en cualquier entorno (dev, preview, prod) |
| Layout `_protected` con `beforeLoad` | Patrón oficial de TanStack Router para rutas protegidas |
| `useSession()` en cliente, `getSession()` en SSR | El navegador envía cookies automáticamente; el servidor necesita forward explícito |
