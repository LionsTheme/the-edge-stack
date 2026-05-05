# Better Auth

## ¿Qué es Better Auth?

**Better Auth** es una librería de autenticación diseñada para el edge. A diferencia de NextAuth/Auth.js:

- **Stateless:** No requiere Redis o session stores en memoria
- **Database-backed:** Las sesiones se almacenan en PostgreSQL
- **Edge-ready:** Funciona en Cloudflare Workers sin hacks
- **Flexible:** Soporta OAuth 2.0, magic links, credentials, y más

## 🔐 Flujo de Autenticación

```
Usuario → Click "Login with Google"
         ↓
Better Auth → Genera URL de autorización
         ↓
Google OAuth → Usuario autoriza
         ↓
Callback /api/auth/callback/google
         ↓
Better Auth → Crea/actualiza usuario en DB
         ↓
Cookie de sesión JWT → Navegador
```

---

## ⚙️ Configuración

### En el Worker (apps/api)

```ts
// apps/api/src/index.ts
import { Hono } from "hono";
import { createAuth } from "@repo/auth";

const app = new Hono();

// Better Auth maneja sus propios endpoints bajo /api/auth/*
app.use("/api/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});
```

### Package de Auth (packages/auth)

```ts
// packages/auth/src/index.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@repo/database";

export interface AuthEnv {
  DATABASE_URL: string;
  AUTH_SECRET: string;
  APP_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

export function createAuth(env: AuthEnv) {
  const db = getDb(env.DATABASE_URL);
  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    secret: env.AUTH_SECRET,
    baseURL: env.APP_URL,
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
  });
}
```

**Puntos clave:**

| Opción | Descripción |
|--------|-------------|
| `database` | Adapter de Drizzle para PostgreSQL |
| `secret` | Clave para firmar JWT |
| `baseURL` | URL pública de la app |
| `socialProviders` | Configuración OAuth |

---

## 🔑 Variables de Entorno Requeridas

```env
AUTH_SECRET=clave-secreta-de-32-caracteres
APP_URL=https://tu-dominio.com
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
```

Ver [Variables de Entorno](Variables-de-Entorno) para instrucciones detalladas.

---

## 📡 Endpoints de API

Better Auth crea automáticamente estos endpoints:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/auth/session` | Obtener sesión actual |
| POST | `/api/auth/sign-in/social` | Iniciar OAuth |
| POST | `/api/auth/sign-out` | Cerrar sesión |
| GET | `/api/auth/callback/:provider` | Callback OAuth |

### Ejemplo: Obtener sesión

```ts
const auth = createAuth(env);
const session = await auth.api.getSession({
  headers: request.headers,
});

console.log(session?.user); // { id, name, email, image }
```

### Ejemplo: Proteger un endpoint

```ts
app.get("/api/protected", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ user: session.user });
});
```

---

## 🔒 Seguridad

### Cookies

Better Auth usa cookies HTTP-only por defecto:
- **Secure:** Solo HTTPS en producción
- **SameSite:** Lax (evita CSRF)
- **HttpOnly:** No accesible desde JavaScript

### Secrets en Producción

En Cloudflare Workers, **nunca** uses `.env`. En su lugar:

```bash
# Configurar secrets
wrangler secret put AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_SECRET
```

Estos se inyectan automáticamente en `c.env`.

---

## 🛠️ Solución de Problemas

### "Invalid client" en login
- Verifica que `APP_URL` coincida exactamente con las URLs en Google Console
- Las redirect URIs deben incluir `/api/auth/callback/google`

### Sesión no persiste
- Verifica que el navegador acepte cookies de terceros
- En desarrollo local, algunos navegadores bloquean cookies cross-site

### "Database connection failed"
- Verifica `DATABASE_URL` en el Worker
- Neon requiere `sslmode=require`