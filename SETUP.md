# ⚡ The Edge Stack — Guía de Primera Ejecución

Esta guía te lleva de cero a tener el boilerplate corriendo localmente con autenticación funcional.

## 📋 Prerrequisitos

- **Node.js >=22.12.0** — `node --version`
- **pnpm >=10** — habilitar con `corepack enable` (viene incluido en Node.js)
- **PostgreSQL** — local o [Neon](https://neon.tech) (free tier)
- **Cuenta de Google Cloud** — para OAuth (Google Console)

## 🚀 Paso a paso

### 1. Crear el proyecto

**Opción A — Usar el template de GitHub (recomendado):**

1. Ir a https://github.com/LionsTheme/the-edge-stack
2. Click en **"Use this template"** → **"Create a new repository"**
3. Elegir owner, nombre y visibilidad
4. Clonar tu nuevo repositorio:

```bash
git clone https://github.com/<tu-usuario>/<tu-repo>.git
cd <tu-repo>
```

**Opción B — Clonar directamente:**

```bash
git clone https://github.com/LionsTheme/the-edge-stack.git
cd the-edge-stack
```

Luego instalar dependencias:

```bash
pnpm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/edgestack_dev

# Auth (Better Auth)
BETTER_AUTH_URL=http://localhost:8787
BETTER_AUTH_SECRET=<generar con: openssl rand -base64 32>

# Frontend
DASH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=<tu-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<tu-client-secret>

# Cloudflare (requerido para deploy)
CLOUDFLARE_ACCOUNT_ID=<tu-account-id>
CLOUDFLARE_API_TOKEN=<tu-api-token>
```

**Google OAuth**: crear credenciales en [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth client ID → Web application. Agregar `http://localhost:8787/api/auth/callback/google` como redirect URI autorizado.

**Cloudflare**: obtener `CLOUDFLARE_ACCOUNT_ID` desde el [dashboard](https://dash.cloudflare.com) (barra lateral derecha) y `CLOUDFLARE_API_TOKEN` desde [API Tokens](https://dash.cloudflare.com/profile/api-tokens) con permisos Workers:Edit + Account:Read. Solo necesario si planeás hacer deploy.

### 3. Crear base de datos local

```bash
# Opción A: PostgreSQL local
sudo -u postgres psql -c "CREATE DATABASE edgestack_dev;"

# Opción B: Neon (serverless, recomendado para producción)
# Crear proyecto en https://neon.tech y copiar la DATABASE_URL
```

### 4. Configurar `.dev.vars` para el API

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars  # si existe example
# O crear manualmente con las mismas variables que .env
```

### 5. Ejecutar migraciones

```bash
pnpm --filter @repo/database db:generate
pnpm --filter @repo/database db:migrate
```

Esto crea las tablas: `posts`, `user`, `session`, `account`, `verification`.

### 6. Arrancar los servicios

```bash
# Terminal 1 — API
pnpm --filter @repo/api dev
# → http://localhost:8787

# Terminal 2 — Dash
pnpm --filter @repo/dash dev
# → http://localhost:3000
```

### 7. Probar autenticación

1. Abrir `http://localhost:3000`
2. Click en **Sign In**
3. Click en **Continue with Google**
4. Autorizar en la ventana de Google
5. Redirigido al Dash autenticado

### 8. Arrancar otras apps (opcional)

```bash
pnpm --filter @repo/landing dev     # → http://localhost:4321
pnpm --filter @repo/blog dev        # → http://localhost:4322
pnpm --filter @repo/docs dev        # → http://localhost:4323
```

## 🏗️ Estructura del monorepo

```
apps/
├── api/          ← 🔒 Auth + API REST (Hono + Workers)
├── dash/         ← 🖥️  Admin SSR (TanStack Start)
├── landing/      ← 📄 Marketing (Astro)
├── blog/         ← ✍️  Contenido (Astro MDX)
└── docs/         ← 📚 Documentación (Starlight)

packages/
├── database/     ← 🗄️  Schema + Migraciones (Drizzle)
├── api-types/    ← 🔗 Tipos RPC (Hono)
└── ui/           ← 🎨 Componentes (shadcn/ui)

services/
└── gateway/      ← 🚪 Router unificado (Cloudflare Service Bindings)

tooling/
├── biome-config/       ← 🧹 Linting + formato (Biome)
├── tailwind-config/    ← 🎨 Tokens + dark mode (Tailwind CSS v4)
├── testing/            ← 🧪 Setup de tests (Vitest + Workers pool)
└── typescript-config/  ← ⚙️  TS configs base
```

Cada directorio tiene su propio `README.md` con documentación específica.

## 🧪 Comandos útiles

```bash
pnpm dev                          # Todas las apps en paralelo
pnpm --filter @repo/api dev       # Solo API
pnpm --filter @repo/database db:studio  # Explorer visual de BD
pnpm --filter @repo/api-types build     # Rebuild de tipos RPC
```

## 🔧 Solución de problemas

| Problema | Solución |
|---|---|
| `Cannot perform I/O on behalf of a different request` | El cliente DB se crea por request en Workers. Asegurate de no cachearlo globalmente |
| `Invalid origin` en auth | Verificar `DASH_URL` en `.dev.vars` |
| `relation "verification" does not exist` | Ejecutar `pnpm --filter @repo/database db:migrate` |
| Sesión no persiste después de login | Revisar cookies SameSite, CORS credentials, y `callbackURL` |
| Error de tipos RPC | Rebuild `pnpm --filter @repo/api-types build` |

## 📚 Siguientes pasos

- Leer `apps/api/README.md` para entender la arquitectura de auth
- Leer `apps/dash/README.md` para el flujo de autenticación
- Leer `services/gateway/README.md` para entender el ruteo unificado
- Leer `packages/database/README.md` para el manejo de migraciones
- Leer `packages/api-types/README.md` para extender tipos RPC
