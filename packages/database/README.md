# 🗄️ `@repo/database` — Drizzle ORM + PostgreSQL

Schema de base de datos, migraciones y cliente unificado con soporte dual: [Neon](https://neon.tech) (serverless) y PostgreSQL local.

## 🏗️ Estructura

```
src/
├── index.ts          # getDb() — factory con detección Neon vs local
├── schema.ts         # Schema principal + re-export de auth-schema
├── auth-schema.ts    # Tablas de Better Auth (user, session, account, verification)
└── seed.ts           # Datos iniciales
drizzle/
├── 0000_awesome_blade.sql    # Migración inicial (posts)
├── 0001_thick_omega_sentinel.sql  # Tablas de auth
└── meta/                     # Journal de migraciones
drizzle.config.ts    # Configuración de drizzle-kit
```

## 🚀 Comandos

```bash
pnpm --filter @repo/database db:generate   # Generar migraciones
pnpm --filter @repo/database db:migrate    # Aplicar migraciones
pnpm --filter @repo/database db:push       # Push directo (desarrollo)
pnpm --filter @repo/database db:studio     # Abrir Drizzle Studio (GUI)
pnpm --filter @repo/database db:seed       # Ejecutar seeds
```

## 🔌 Dual driver

`getDb()` detecta automáticamente si usar Neon o PostgreSQL local:

```ts
import { getDb } from "@repo/database";

const db = getDb(process.env.DATABASE_URL);
// Si la URL contiene "neon.tech" → usa @neondatabase/serverless (HTTP/WebSocket)
// Si no → usa postgres-js (TCP, solo Node.js/dev)
```

| Entorno | Driver | Transporte |
|---|---|---|
| Neon (producción) | `drizzle-orm/neon-http` | HTTP/WebSocket |
| PostgreSQL local | `drizzle-orm/postgres-js` | TCP directo |

### ¿Por qué no `postgres-js` en Workers?

Cloudflare Workers aísla el I/O entre requests — las conexiones TCP no pueden compartirse. En producción se usa Neon (HTTP). En desarrollo local, wrangler ejecuta Node.js donde `postgres-js` funciona.

## 📋 Tablas

| Tabla | Origen | Descripción |
|---|---|---|
| `posts` | Schema propio | Posts de ejemplo |
| `user` | Better Auth CLI | Usuarios |
| `session` | Better Auth CLI | Sesiones activas |
| `account` | Better Auth CLI | Cuentas OAuth vinculadas |
| `verification` | Better Auth CLI | Tokens de verificación/estado |

## 🔄 Regenerar schema de auth

Cuando agregues plugins o campos a Better Auth:

```bash
cd apps/api
pnpm dlx @better-auth/cli@latest generate \
  --config ./better-auth.config.ts \
  --output ../packages/database/src/auth-schema.ts
cd ../..
pnpm --filter @repo/database db:generate
pnpm --filter @repo/database db:migrate
```
