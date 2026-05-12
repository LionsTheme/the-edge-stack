# ⚡ The Edge Stack — Quick Start Guide

This guide takes you from zero to having the boilerplate running locally with working authentication.

## 📋 Prerequisites

- **Node.js >=22.12.0** — `node --version`
- **pnpm >=10** — enable with `corepack enable` (included in Node.js)
- **PostgreSQL** — local or [Neon](https://neon.tech) (free tier)
- **Google Cloud account** — for OAuth (Google Console)

## 🚀 Step by Step

### 1. Create the project

**Option A — Use the GitHub template (recommended):**

1. Go to https://github.com/LionsTheme/the-edge-stack
2. Click **"Use this template"** → **"Create a new repository"**
3. Choose owner, name, and visibility
4. Clone your new repository:

```bash
git clone https://github.com/<your-user>/<your-repo>.git
cd <your-repo>
```

**Option B — Clone directly:**

```bash
git clone https://github.com/LionsTheme/the-edge-stack.git
cd the-edge-stack
```

Then install dependencies:

```bash
pnpm install
```

### 2. Configure environment variables

Each app manages its own environment variables. The API is the only one that requires configuration:

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` with your values:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/edgestack_dev

# Auth (Better Auth)
BETTER_AUTH_URL=http://localhost:8787
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>

# Frontend
DASH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Cloudflare (required for deploy)
CLOUDFLARE_ACCOUNT_ID=<your-account-id>
CLOUDFLARE_API_TOKEN=<your-api-token>
```

**Google OAuth**: Create credentials at [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth client ID → Web application. Add `http://localhost:8787/api/auth/callback/google` as an authorized redirect URI.

**Cloudflare**: Get `CLOUDFLARE_ACCOUNT_ID` from the [dashboard](https://dash.cloudflare.com) (right sidebar) and `CLOUDFLARE_API_TOKEN` from [API Tokens](https://dash.cloudflare.com/profile/api-tokens) with Workers:Edit + Account:Read permissions. Only needed if you plan to deploy.

### 3. Create local database

```bash
# Option A: Local PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE edgestack_dev;"

# Option B: Neon (serverless, recommended for production)
# Create project at https://neon.tech and copy the DATABASE_URL
```

### 4. Run migrations

```bash
pnpm --filter @repo/database db:generate
pnpm --filter @repo/database db:migrate
```

This creates the tables: `posts`, `user`, `session`, `account`, `verification`.

### 5. Start services

```bash
# Terminal 1 — API
pnpm --filter @repo/api dev
# → http://localhost:8787

# Terminal 2 — Dash
pnpm --filter @repo/dash dev
# → http://localhost:3000
```

### 6. Test authentication

1. Open `http://localhost:3000`
2. Click **Sign In**
3. Click **Continue with Google**
4. Authorize in the Google window
5. Redirected to the authenticated Dash

### 7. Start other apps (optional)

```bash
pnpm --filter @repo/landing dev     # → http://localhost:4321
pnpm --filter @repo/blog dev        # → http://localhost:4322
pnpm --filter @repo/docs dev        # → http://localhost:4323
```

## 🏗️ Monorepo Structure

```
apps/
├── api/          ← 🔒 Auth + REST API (Hono + Workers)
├── dash/         ← 🖥️  Admin SSR (TanStack Start)
├── landing/      ← 📄 Marketing (Astro)
├── blog/         ← ✍️  Content (Astro MDX)
├── docs/         ← 📚 Documentation (Starlight)
└── gateway/      ← 🚪 Unified Router (Cloudflare Service Bindings)

packages/
├── database/     ← 🗄️  Schema + Migrations (Drizzle)
├── api-types/    ← 🔗 RPC Types (Hono)
└── ui/           ← 🎨 Components (shadcn/ui)

tooling/
├── biome-config/       ← 🧹 Linting + formatting (Biome)
├── tailwind-config/    ← 🎨 Tokens + dark mode (Tailwind CSS v4)
├── testing/            ← 🧪 Test setup (Vitest + Workers pool)
└── typescript-config/  ← ⚙️  Base TS configs
```

Each directory has its own `README.md` with specific documentation.

## 🧪 Useful Commands

```bash
pnpm dev                          # All apps in parallel
pnpm --filter @repo/api dev       # API only
pnpm --filter @repo/database db:studio  # Visual DB Explorer
pnpm --filter @repo/api-types build     # Rebuild RPC types
```

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| `Cannot perform I/O on behalf of a different request` | The DB client is created per request in Workers. Make sure not to cache it globally |
| `Invalid origin` in auth | Verify `DASH_URL` in `apps/api/.env` |
| `relation "verification" does not exist` | Run `pnpm --filter @repo/database db:migrate` |
| Session doesn't persist after login | Review cookies SameSite, CORS credentials, and `callbackURL` |
| RPC type errors | Rebuild: `pnpm --filter @repo/api-types build` |

## 🛠️ Customizing the Monorepo

If your project doesn't need all apps (e.g., only API + Dash + Landing), remove the ones you don't use and update the Gateway:

```bash
# Remove unused apps
rm -rf apps/blog apps/docs
```

Then modify three files in the Gateway:

- **`apps/gateway/wrangler.jsonc`** — remove the `BLOG` and `DOCS` bindings from `services` and from the `ROUTES` variable
- **`apps/gateway/src/types.ts`** — remove `BLOG` and `DOCS` from the `Env` interface
- **`apps/gateway/src/router.ts`** — remove `"BLOG"` and `"DOCS"` from `BINDING_KEYS`

```bash
# Verify everything compiles
pnpm install && pnpm --filter @repo/gateway typecheck
```

TypeScript (`BindingKey`) ensures all three files stay consistent — if a binding is missing from `Env`, `router.ts` won't compile.

### Adding a new app

```bash
mkdir -p apps/shop/src
```

Create `apps/shop/wrangler.jsonc` and `apps/shop/package.json` as a standard Worker. Then register it in three Gateway files:

- **`apps/gateway/wrangler.jsonc`** — add binding `{ "binding": "SHOP", "service": "shop" }` and route `{"binding":"SHOP","path":"/shop"}` in `ROUTES`
- **`apps/gateway/src/types.ts`** — add `SHOP: Fetcher` to the `Env` interface
- **`apps/gateway/src/router.ts`** — add `"SHOP"` to `BINDING_KEYS`

```bash
pnpm install && pnpm --filter @repo/gateway typecheck
```

If you forget any of the three files, TypeScript won't compile.

## 📚 Next Steps

- Read `apps/api/README.md` to understand the auth architecture
- Read `apps/dash/README.md` for the authentication flow
- Read `apps/gateway/README.md` to understand unified routing
- Read `packages/database/README.md` for migration handling
- Read `packages/api-types/README.md` to extend RPC types