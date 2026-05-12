# 🖥️ `apps/dash` — TanStack Start

SSR dashboard with [TanStack Start](https://tanstack.com/start) + [React 19](https://react.dev). Authentication with Google OAuth, protected routes, and typed API consumption via Hono RPC.

## 🏗️ Structure

```
src/
├── routes/
│   ├── __root.tsx              # Root layout (head, styles, devtools)
│   ├── index.tsx               # Public home — shows session if available
│   ├── sign-in.tsx             # Sign-in with Google OAuth
│   ├── _protected.tsx          # Protected layout — beforeLoad verifies session
│   └── _protected/
│       └── dashboard.tsx       # Dash — shows user, sign-out button
├── lib/
│   ├── api.ts                  # Hono RPC client (hc<AppType>)
│   ├── auth-client.ts          # Better Auth React client
│   └── auth.functions.ts       # Server function to verify session in SSR
├── router.tsx                  # TanStack Router configuration
├── routeTree.gen.ts            # Auto-generated route tree
└── styles.css                  # Tailwind CSS + tokens
vite.config.ts                  # Vite + Cloudflare plugin + TanStack Start
```

## 🚀 Startup

```bash
pnpm --filter @repo/dash dev
```

Available at `http://localhost:3000`.

## 🔐 Authentication Flow

```
User → /sign-in → Google OAuth → API callback → session cookie
                                                         ↓
                                               redirect to /dash
                                                         ↓
                                        _protected.tsx verifies session (SSR)
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
  const request = getRequest();                    // Original request
  const cookie = request.headers.get("cookie");    // Forward cookies
  const res = await fetch(`${apiUrl}/api/auth/get-session`, { headers: { cookie } });
  // ...
});
```

The server function uses `getRequest()` from TanStack Start to access the original request headers, forwards the cookie to the API, and returns the validated session.

### Protected Routes

The `_protected.tsx` layout runs `beforeLoad` → `getSession()`. If there's no session, it redirects to `/sign-in`. Child routes receive `{ user }` in the context.

## 🔗 Hono RPC

Typed client via `@repo/api-types`:

```ts
// lib/api.ts
import { hc } from "hono/client";
import type { AppType } from "@repo/api-types";
export const api = hc<AppType>("/api");

// Autocomplete in .$get(), query params and response
const res = await api.message.$get({ query: { name: "Hono" } });
```

## 📦 Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | API URL (default: `http://localhost:8787`) |

## 🧠 Design Decisions

| Decision | Reason |
|---|---|
| Server function forwards cookies to API | The Dashboard doesn't have direct access to Better Auth — the API is the single source of truth |
| `getRequest()` instead of `getRequestHeaders()` | Stable TanStack Start API; returns a standard Request object |
| `window.location.origin` for callbackURL | Resolves dynamically in any environment (dev, preview, prod) |
| `_protected` layout with `beforeLoad` | Official TanStack Router pattern for protected routes |
| `useSession()` on client, `getSession()` in SSR | The browser sends cookies automatically; the server needs explicit forwarding |