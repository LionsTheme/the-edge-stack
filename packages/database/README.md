# 🗄️ `@repo/database` — Drizzle ORM + PostgreSQL

Database schema, migrations, and unified client with dual support: [Neon](https://neon.tech) (serverless) and local PostgreSQL.

## 🏗️ Structure

```
src/
├── index.ts          # getDb() — factory with Neon vs local detection
├── schema.ts         # Main schema + re-export from auth-schema
├── auth-schema.ts    # Better Auth tables (user, session, account, verification)
└── seed.ts           # Initial data
drizzle/
├── 0000_awesome_blade.sql    # Initial migration (posts)
├── 0001_thick_omega_sentinel.sql  # Auth tables
└── meta/                     # Migration journal
drizzle.config.ts    # drizzle-kit configuration
```

## 🚀 Commands

```bash
pnpm --filter @repo/database db:generate   # Generate migrations
pnpm --filter @repo/database db:migrate    # Apply migrations
pnpm --filter @repo/database db:push       # Direct push (development)
pnpm --filter @repo/database db:studio     # Open Drizzle Studio (GUI)
pnpm --filter @repo/database db:seed       # Run seeds
```

## 🔌 Dual Driver

`getDb()` automatically detects whether to use Neon or local PostgreSQL:

```ts
import { getDb } from "@repo/database";

const db = getDb(process.env.DATABASE_URL);
// If the URL contains "neon.tech" → uses @neondatabase/serverless (HTTP/WebSocket)
// If not → uses postgres-js (TCP, Node.js/dev only)
```

| Environment | Driver | Transport |
|---|---|---|
| Neon (production) | `drizzle-orm/neon-http` | HTTP/WebSocket |
| Local PostgreSQL | `drizzle-orm/postgres-js` | Direct TCP |

### Why not `postgres-js` in Workers?

Cloudflare Workers isolate I/O between requests — TCP connections cannot be shared. In production, Neon (HTTP) is used. In local development, wrangler runs Node.js where `postgres-js` works.

## 📋 Tables

| Table | Origin | Description |
|---|---|---|
| `posts` | Own schema | Example posts |
| `user` | Better Auth CLI | Users |
| `session` | Better Auth CLI | Active sessions |
| `account` | Better Auth CLI | Linked OAuth accounts |
| `verification` | Better Auth CLI | Verification tokens/status |

## 🔄 Regenerate Auth Schema

When adding plugins or fields to Better Auth:

```bash
cd apps/api
pnpm dlx @better-auth/cli@latest generate \
  --config ./better-auth.config.ts \
  --output ../packages/database/src/auth-schema.ts
cd ../..
pnpm --filter @repo/database db:generate
pnpm --filter @repo/database db:migrate
```