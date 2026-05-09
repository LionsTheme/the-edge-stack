# 🚀 The Edge Stack

Edge-first monorepo boilerplate designed for ultra-fast applications. Built with Turborepo, Hono, Drizzle, Neon, TanStack Start, Astro, Starlight, and Cloudflare Workers.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/LionsTheme/the-edge-stack)

> **📚 Documentación Extendida:** Visita nuestra [Wiki](https://github.com/LionsTheme/the-edge-stack/wiki) para guías detalladas paso a paso sobre cada tecnología del stack.

---

## ✨ Features

- ⚡ **Edge-First**: Deploy to 300+ locations worldwide with Cloudflare Workers
- 🔒 **Type-Safe End-to-End**: Hono RPC shares types between API and frontend
- 🗄️ **Serverless Database**: Neon Postgres with branching for previews
- 🔐 **Stateless Auth**: Better Auth optimized for edge runtimes
- 📦 **Monorepo**: Turborepo + pnpm with shared configs and components
- 🎨 **Shared Design System**: Shadcn/ui + Tailwind CSS across all apps
- 🧪 **Testing Ready**: Vitest with Cloudflare Workers pool
- 📚 **Documentation**: Astro Starlight with shared design tokens

---

## 🏗️ Architecture

```
                  ┌─────────────────┐
                  │   Cloudflare    │
                  │    Gateway      │
                  └────────┬────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌─────▼─────┐     ┌─────▼──────┐
   │   API   │      │ Dashboard │     │  Landing   │
   │ (Hono)  │      │(TanStack) │     │  (Astro)   │
   └────┬────┘      └───────────┘     └────────────┘
        │
   ┌────▼────┐
   │  Neon   │
   │(Postgres)│
   └─────────┘
```

### Authentication Flow

Better Auth lives inside `apps/api` (following the [official Hono integration pattern](https://better-auth.com/docs/integrations/hono)), not as a separate package. Any app in the monorepo consumes auth via HTTP:

```
                  ┌─────────────┐
                  │  Dashboard  │ ──signIn.social()──►
                  │ (TanStack)  │ ◄──callbackURL──────
                  └─────────────┘
                         │
                  fetch /api/auth/get-session (cookie)
                         │
                         ▼
                  ┌─────────────┐
                  │   API       │
                  │ (Hono+Auth) │ ──betterAuth()──►  PostgreSQL
                  └─────────────┘
```

- **Client-side**: `createAuthClient` from `better-auth/react` → typed hooks (`useSession`, `signIn`, `signOut`)
- **SSR**: `getSession()` server function forwards cookies to the API → validates on the server
- **Protected routes**: `_protected.tsx` layout with `beforeLoad` redirecting to `/sign-in`
- **OAuth**: Google provider → API handles callback → session cookie set on API domain

### Hono RPC Types

End-to-end type safety between API and frontend via `@repo/api-types`:

```
apps/api/src/routes.ts ──export AppType──► packages/api-types ──► apps/dashboard
                                                 │
                                          hc<AppType>("/api")
                                                 │
                                          api.message.$get() ← autocompletado
```

- **`apps/api/src/routes.ts`** exports `AppType` from routes (without Cloudflare bindings)
- **`packages/api-types`** re-exports it for consumption by any frontend
- **Dashboard** uses `hc<AppType>(url)` from `hono/client` for typed fetch calls

| App | Technology | URL Path | Purpose |
|-----|-----------|----------|---------|
| API | Hono + Workers | `/api/*` | Type-safe REST API |
| Dashboard | TanStack Start | `/app/*` | Interactive admin interface |
| Landing | Astro | `/*` | Marketing page (static) |
| Blog | Astro | `/blog/*` | Content marketing |
| Docs | Starlight | `/docs/*` | Technical documentation |
| Gateway | Cloudflare Worker | `/` | Unified routing |

> **Note:** `wrangler.toml` files are not committed (they contain sensitive data). Copy from `.example.wrangler.toml` files after cloning.
> ```bash
> cp apps/api/wrangler.toml.example apps/api/wrangler.toml
> cp apps/gateway/wrangler.toml.example apps/gateway/wrangler.toml
> ```

---

## 📖 Quick Start

### Prerequisites

Before starting, make sure you have:

- [Node.js](https://nodejs.org/) 20+ installed (`node --version`)
- [pnpm](https://pnpm.io/) 9+ installed (`pnpm --version`)
- A [Cloudflare](https://cloudflare.com) account (free)
- A [Neon](https://neon.tech) database (free tier available)

> **New to these tools?** Check our [Wiki - Getting Started](https://github.com/LionsTheme/the-edge-stack/wiki) for detailed setup instructions.

### 1. Create from Template

Click **"Use this template"** on GitHub or clone directly:

```bash
git clone https://github.com/LionsTheme/the-edge-stack.git
cd the-edge-stack
```

### 2. Install Dependencies

```bash
pnpm install
```

> **What is pnpm?** It's a fast, disk space efficient package manager. Learn more in our [Wiki - Turborepo & pnpm](https://github.com/LionsTheme/the-edge-stack/wiki/Turborepo-y-pnpm).

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit with your values (see detailed guide below)
nano .env   # or vim, code, etc.
```

**Required variables:**

| Variable | Where to get it | Guide |
|----------|----------------|-------|
| `DATABASE_URL` | [Neon Dashboard](https://console.neon.tech) or local PostgreSQL | [Wiki](https://github.com/LionsTheme/the-edge-stack/wiki/Neon-PostgreSQL) |
| `BETTER_AUTH_SECRET` | Generate with `openssl rand -base64 32` | [Wiki](https://github.com/LionsTheme/the-edge-stack/wiki/Better-Auth) |
| `BETTER_AUTH_URL` | Your API URL (e.g. `http://localhost:8787`) | [Wiki](https://github.com/LionsTheme/the-edge-stack/wiki/Variables-de-Entorno) |
| `DASHBOARD_URL` | Your frontend URL (e.g. `http://localhost:3000`) | [Wiki](https://github.com/LionsTheme/the-edge-stack/wiki/Variables-de-Entorno) |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) | [Wiki](https://github.com/LionsTheme/the-edge-stack/wiki/Variables-de-Entorno) |
| `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com) | [Wiki](https://github.com/LionsTheme/the-edge-stack/wiki/Variables-de-Entorno) |

> **📖 Detailed env setup:** See [Wiki - Variables de Entorno](https://github.com/LionsTheme/the-edge-stack/wiki/Variables-de-Entorno) for step-by-step instructions with screenshots.

### 4. Setup Database

```bash
# Run migrations
pnpm db:migrate

# (Optional) Generate initial types
pnpm db:generate
```

> **What are migrations?** They're versioned SQL files that update your database schema safely. Learn more in [Wiki - Drizzle ORM](https://github.com/LionsTheme/the-edge-stack/wiki/Drizzle-ORM).

### 5. Start Development

```bash
pnpm dev
```

This starts all apps in parallel:

| App | URL | Description |
|-----|-----|-------------|
| API | http://localhost:8787 | Hono API with RPC |
| Dashboard | http://localhost:3000 | TanStack Start app |
| Landing | http://localhost:4321 | Astro landing page |
| Blog | http://localhost:4322 | Astro blog |
| Docs | http://localhost:4323 | Starlight documentation |

---

## 📝 Available Scripts

Run from the root directory:

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps for production |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:studio` | Open Drizzle Studio (GUI) |
| `pnpm auth:generate` | Regenerate Better Auth Drizzle schema |
| `pnpm clean` | Clean all build outputs |

Run in a specific app/package:

```bash
# Start the API locally
pnpm --filter @repo/api dev

# Start the Dashboard locally
pnpm --filter @repo/dashboard dev

# Build only the UI package
pnpm --filter @repo/ui build

# Regenerate auth schema (after adding plugins/fields)
cd apps/api && pnpm dlx @better-auth/cli@latest generate \
  --config ./better-auth.config.ts \
  --output ../packages/database/src/auth-schema.ts
```

---

## 🌐 Deployment

### Architecture Overview

```
User → Cloudflare Gateway → [API | Dashboard | Landing | Blog | Docs]
                                    │
                              Neon PostgreSQL
```

### Step-by-Step Deployment

**1. API Worker**
```bash
cd apps/api
wrangler deploy
```

**2. Gateway Worker**
```bash
cd apps/gateway
wrangler deploy
```

**3. Static Apps**
```bash
# Landing
cd apps/landing && pnpm build && wrangler pages deploy dist

# Blog
cd apps/blog && pnpm build && wrangler pages deploy dist

# Docs
cd apps/docs && pnpm build && wrangler pages deploy dist
```

**4. Dashboard**
```bash
cd apps/dashboard
pnpm build
wrangler pages deploy .output
```

> **📖 Detailed deployment guide:** See [Wiki - Despliegue](https://github.com/LionsTheme/the-edge-stack/wiki/Despliegue) for production checklists, CI/CD setup, and DNS configuration.

---

## 📚 Documentation

### Wiki (Recommended for Beginners)

Our [Wiki](https://github.com/LionsTheme/the-edge-stack/wiki) contains detailed guides for every technology:

- [Variables de Entorno](https://github.com/LionsTheme/the-edge-stack/wiki/Variables-de-Entorno) - Complete env setup guide
- [Variables de Entorno Compartidas](https://github.com/LionsTheme/the-edge-stack/wiki/Variables-de-Entorno-Compartidas) - Centralized env management
- [Turborepo & pnpm](https://github.com/LionsTheme/the-edge-stack/wiki/Turborepo-y-pnpm) - Understanding the monorepo
- [Flujo de Desarrollo Local](https://github.com/LionsTheme/the-edge-stack/wiki/Flujo-de-Desarrollo-Local) - Local dev with Wrangler & cloudflared
- [Service Bindings y Routing](https://github.com/LionsTheme/the-edge-stack/wiki/Service-Bindings-y-Routing) - Gateway pattern & CORS avoidance
- [Neon PostgreSQL](https://github.com/LionsTheme/the-edge-stack/wiki/Neon-PostgreSQL) - Database setup
- [Drizzle ORM](https://github.com/LionsTheme/the-edge-stack/wiki/Drizzle-ORM) - Database operations
- [Migraciones y Entornos](https://github.com/LionsTheme/the-edge-stack/wiki/Migraciones-y-Entornos) - Migration strategy with Neon Branching
- [Better Auth](https://github.com/LionsTheme/the-edge-stack/wiki/Better-Auth) - Authentication setup
- [Better Auth y Drizzle](https://github.com/LionsTheme/the-edge-stack/wiki/Better-Auth-y-Drizzle) - Auth + business tables in same DB
- [Hono API](https://github.com/LionsTheme/the-edge-stack/wiki/Hono-API) - API development
- [TanStack Start](https://github.com/LionsTheme/the-edge-stack/wiki/TanStack-Start) - Dashboard development
- [Astro](https://github.com/LionsTheme/the-edge-stack/wiki/Astro) - Landing & blog
- [Starlight](https://github.com/LionsTheme/the-edge-stack/wiki/Astro-Starlight) - Documentation
- [Shadcn & Tailwind](https://github.com/LionsTheme/the-edge-stack/wiki/Shadcn-y-Tailwind) - UI components
- [Cloudflare Workers](https://github.com/LionsTheme/the-edge-stack/wiki/Cloudflare-Workers) - Edge computing
- [Local Explorer](https://github.com/LionsTheme/the-edge-stack/wiki/Local-Explorer) - Local admin interface for debugging
- [Consejos y Buenas Prácticas](https://github.com/LionsTheme/the-edge-stack/wiki/Consejos-y-Buenas-Practicas) - Tips for daily development
- [Deployment](https://github.com/LionsTheme/the-edge-stack/wiki/Despliegue) - Production deployment
- [FAQ](https://github.com/LionsTheme/the-edge-stack/wiki/FAQ) - Common questions

### In-Repo Docs

- `.env.example` - Detailed environment variable explanations
- `apps/docs/` - Full documentation site built with Starlight

---

## 🏗️ Project Structure

```
the-edge-stack/
├── apps/
│   ├── api/                   # Hono API (Cloudflare Worker)
│   │   ├── src/
│   │   │   ├── index.ts           # Entry point + auth middleware
│   │   │   ├── routes.ts          # API routes + AppType for RPC
│   │   │   └── lib/
│   │   │       └── auth.ts        # Better Auth instance (per-request)
│   │   ├── better-auth.config.ts  # CLI config for schema generation
│   │   ├── .dev.vars              # Local secrets (gitignored)
│   │   └── wrangler.jsonc
│   ├── dashboard/             # TanStack Start SSR app
│   │   ├── src/
│   │   │   ├── routes/            # File-based routes
│   │   │   │   ├── __root.tsx         # Root layout
│   │   │   │   ├── index.tsx          # Public home
│   │   │   │   ├── sign-in.tsx        # Sign-in page (Google OAuth)
│   │   │   │   ├── _protected.tsx     # Protected layout (auth check)
│   │   │   │   └── _protected/
│   │   │   │       └── dashboard.tsx  # Protected dashboard
│   │   │   ├── lib/
│   │   │   │   ├── api.ts             # Hono RPC client (type-safe)
│   │   │   │   ├── auth-client.ts     # Better Auth React client
│   │   │   │   └── auth.functions.ts  # SSR session check (server fn)
│   │   │   ├── router.tsx
│   │   │   └── routeTree.gen.ts
│   │   └── vite.config.ts
│   ├── landing/               # Astro landing page
│   ├── blog/                  # Astro blog (MDX)
│   ├── docs/                  # Starlight documentation
│   └── gateway/               # Cloudflare Gateway Worker
├── packages/
│   ├── database/              # Drizzle schema, migrations, getDb()
│   ├── api-types/             # Shared types for Hono RPC (AppType)
│   ├── ui/                    # Shared UI components (Shadcn)
│   ├── tailwind-config/       # Shared Tailwind config
│   └── typescript-config/     # Shared TS configs
├── tooling/
├── services/
├── .github/workflows/         # CI/CD pipelines
├── turbo.json                 # Turborepo pipeline
├── pnpm-workspace.yaml        # pnpm workspace config
└── .env.example               # Environment template
```

---

## 🔗 Gateway Routing

The Cloudflare Gateway Worker unifies all apps under a single domain:

| Path | Destination | Technology |
|------|-------------|------------|
| `/api/*` | API Worker | Hono + Cloudflare Workers |
| `/app/*` | Dashboard | TanStack Start |
| `/blog/*` | Blog | Astro |
| `/docs/*` | Documentation | Starlight |
| `/*` | Landing page | Astro |

This eliminates CORS issues and simplifies authentication.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Hono](https://hono.dev) - Ultralight web framework
- [Drizzle ORM](https://orm.drizzle.team) - Type-safe SQL
- [TanStack](https://tanstack.com) - Modern React tools
- [Astro](https://astro.build) - Content-focused web framework
- [Starlight](https://starlight.astro.build) - Documentation framework
- [Better Auth](https://better-auth.com) - Authentication for the edge
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Cloudflare Workers](https://workers.cloudflare.com) - Edge computing platform