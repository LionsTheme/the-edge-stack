# Drizzle ORM

## ¿Qué es Drizzle?

**Drizzle ORM** es un ORM ligero y rápido diseñado específicamente para entornos serverless y edge:

- **Type-safe:** Los tipos se generan automáticamente desde el schema
- **SQL-like API:** Escribe queries que parecen SQL puro
- **Edge-ready:** Compatibilidad con Cloudflare Workers, Deno, etc.
- **Migraciones:** Sistema de migraciones versionado con `drizzle-kit`

## 📐 Schema

### Definiendo Tablas

```ts
// packages/database/src/schema.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: text("authorId").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
```

**Explicación:**

| Función | Uso |
|---------|-----|
| `pgTable()` | Define una tabla PostgreSQL |
| `uuid()` | Columna UUID con generación automática |
| `text()` | Columna de texto (varchar ilimitado) |
| `timestamp()` | Fecha y hora con zona horaria |
| `.notNull()` | Columna obligatoria |
| `.defaultNow()` | Valor por defecto: timestamp actual |
| `.primaryKey()` | Clave primaria |

### Relaciones

```ts
export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

---

## 🚀 Migraciones

### Flujo de Trabajo

```bash
# PASO 1: Modificar schema.ts
# ...edita las tablas...

# PASO 2: Generar archivo de migración
pnpm db:generate
# Crea: packages/database/drizzle/0001_nombre.sql

# PASO 3: Revisar el SQL generado
# Verifica que el archivo .sql sea correcto

# PASO 4: Aplicar migración
pnpm db:migrate
# Ejecuta el SQL en la base de datos
```

### ⚠️ IMPORTANTE: NUNCA uses `db:push` en producción

```bash
# ❌ MAL - Solo para desarrollo rápido
pnpm db:push

# ✅ CORRECTO - Para cualquier entorno real
pnpm db:generate
pnpm db:migrate
```

`db:push` modifica la base de datos directamente sin crear historial. Solo úsalo en desarrollo local.

---

## 📝 Queries

### Select (Leer)

```ts
import { getDb } from "@repo/database";

const db = getDb(databaseUrl);

// Todos los posts
const allPosts = await db.query.posts.findMany();

// Con filtros
const filtered = await db.query.posts.findMany({
  where: (posts, { eq }) => eq(posts.authorId, "user123"),
});

// Con límite
const recent = await db.query.posts.findMany({
  orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  limit: 10,
});
```

### Insert (Crear)

```ts
const newPost = await db.insert(posts).values({
  title: "Mi primer post",
  content: "Contenido del post...",
  authorId: "user123",
}).returning();
```

### Update (Actualizar)

```ts
await db.update(posts)
  .set({ title: "Título actualizado" })
  .where(eq(posts.id, "uuid-aqui"));
```

### Delete (Eliminar)

```ts
await db.delete(posts)
  .where(eq(posts.id, "uuid-aqui"));
```

---

## 🔗 Integración con Better Auth

Better Auth genera automáticamente sus tablas (`user`, `session`, `account`, `verification`).

### Extender el usuario

**NO definas la tabla `user` manualmente.** En su lugar:

```ts
// packages/database/src/schema.ts
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  bio: text("bio"),
  website: text("website"),
});
```

Esto crea una relación uno-a-uno con la tabla `user` de Better Auth.

---

## 🧪 Testing

Para tests de integración, usa un branch de Neon o levanta PostgreSQL local:

```ts
// test setup
const testDb = getDb("postgresql://test:test@localhost:5432/test_db");

// En cada test, limpia la tabla
await testDb.delete(posts);

// Inserta datos de prueba
await testDb.insert(posts).values({
  title: "Test post",
  content: "Test content",
  authorId: "test-user",
});
```