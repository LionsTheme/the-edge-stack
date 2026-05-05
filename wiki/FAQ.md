# Preguntas Frecuentes (FAQ)

## General

### ¿Puedo usar este stack para proyectos comerciales?

**Sí.** Todo el stack está bajo licencias open-source permisivas (MIT, Apache 2.0). Puedes usarlo libremente.

### ¿Necesito pagar algo?

**Para desarrollo y proyectos pequeños: No.**

| Servicio | Plan Gratis | Cuándo pagar |
|----------|-------------|-------------|
| Cloudflare Workers | 100k requests/día | >100k requests/día |
| Neon | 500 MB storage | >500 MB |
| GitHub | Repos públicos ilimitados | Repos privados |

### ¿Puedo usar otro framework en lugar de TanStack Start?

**Sí.** La API es independiente del frontend. Puedes reemplazar TanStack Start por:
- Next.js App Router
- Remix
- SvelteKit
- Cualquier framework que consuma la API REST

---

## Base de Datos

### ¿Puedo usar PostgreSQL local en lugar de Neon?

**Sí, para desarrollo.** Cambia `DATABASE_URL` en `.env`:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
```

Para producción, recomendamos Neon por su branching y backups automáticos.

### ¿Cómo hago backup de la base de datos?

Neon hace backups automáticos. También puedes:

```bash
# Exportar
pg_dump $DATABASE_URL > backup.sql

# Importar
psql $DATABASE_URL < backup.sql
```

---

## Autenticación

### ¿Puedo agregar más proveedores OAuth?

**Sí.** Better Auth soporta GitHub, Discord, Twitter, Apple, y más:

```ts
socialProviders: {
  google: { /* ... */ },
  github: {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  },
}
```

### ¿Funciona sin OAuth (solo email/password)?

**Sí.** Better Auth soporta credenciales:

```ts
betterAuth({
  emailAndPassword: {
    enabled: true,
  },
});
```

---

## Despliegue

### ¿Puedo desplegar en AWS/GCP/Azure en lugar de Cloudflare?

**Parcialmente.** La API usa Cloudflare Workers APIs (como `Fetcher`), por lo que no es directamente portable. Sin embargo:

- Las apps Astro funcionan en cualquier host estático
- El dashboard (TanStack Start) funciona en cualquier servidor Node.js
- La API puede portarse a Hono con adapter de Node.js

### ¿Cómo escala esto?

**Automáticamente.**

- Cloudflare Workers: escala a millones de requests
- Neon: auto-scaling de compute
- Astro: CDN distribuido globalmente

No necesitas configurar load balancers ni auto-scaling groups.

---

## Desarrollo

### ¿Por qué pnpm y no npm/yarn?

pnpm es más rápido, usa menos espacio en disco, y tiene mejor soporte para workspaces. Si prefieres, puedes usar npm workspaces o yarn, pero tendrás que adaptar la configuración.

### ¿Cómo agrego una nueva app?

1. Crea carpeta en `apps/mi-app/`
2. Crea `package.json` con `"name": "@repo/mi-app"`
3. Añade scripts `build` y `dev`
4. Actualiza `turbo.json` si es necesario

### Los cambios en packages no se reflejan

```bash
# Reconstruir dependencias
pnpm install

# O fuerza rebuild
pnpm --filter @repo/ui build
```

---

## Problemas Comunes

### "Cannot find module '@repo/...'"

```bash
# Reinstalar dependencias
pnpm install

# Verificar que el nombre en package.json coincida
```

### "Wrangler not found"

```bash
# Instalar wrangler
npm install -g wrangler

# O usar npx
npx wrangler dev
```

### "Database connection failed"

- Verifica que `DATABASE_URL` incluya `?sslmode=require`
- Si usas PostgreSQL local, quita `sslmode=require`
- Verifica que la base de datos esté accesible desde tu red

---

## Contribuir

### ¿Cómo reporto un bug?

[Abre un issue](https://github.com/LionsTheme/the-edge-stack/issues) en GitHub con:
- Descripción del problema
- Pasos para reproducirlo
- Tu entorno (OS, Node version, etc.)

### ¿Puedo contribuir código?

**¡Por supuesto!** Haz fork del repo, crea una branch, y abre un Pull Request.