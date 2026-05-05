# The Edge Stack - Wiki

Bienvenido a la documentación completa de **The Edge Stack**. Esta wiki está diseñada para desarrolladores de todos los niveles, incluyendo aquellos que no tienen experiencia previa con estas tecnologías.

## 📚 Índice de Documentación

### 🚀 Primeros Pasos
- [Variables de Entorno](Variables-de-Entorno) - Guía completa de configuración de `.env`
- [Turborepo y pnpm](Turborepo-y-pnpm) - Entendiendo el monorepo
- [Despliegue](Despliegue) - Lleva tu app a producción

### 🗄️ Capa de Datos
- [Neon PostgreSQL](Neon-PostgreSQL) - Base de datos serverless
- [Drizzle ORM](Drizzle-ORM) - ORM type-safe para el edge

### 🔐 Autenticación y API
- [Better Auth](Better-Auth) - Autenticación stateless
- [Hono API](Hono-API) - Framework ultraligero con RPC

### 💻 Frontend
- [TanStack Start](TanStack-Start) - Dashboard SSR
- [Astro](Astro) - Landing page y blog
- [Astro Starlight](Astro-Starlight) - Documentación técnica

### 🎨 Diseño y UI
- [Shadcn y Tailwind](Shadcn-y-Tailwind) - Sistema de diseño compartido

### ☁️ Infraestructura
- [Cloudflare Workers](Cloudflare-Workers) - Edge computing

### ❓ Soporte
- [FAQ](FAQ) - Preguntas frecuentes

---

## 🗺️ Mapa del Stack

```
Usuario → Cloudflare Gateway → [API | Dashboard | Landing | Blog | Docs]
                                      ↓
                                Neon PostgreSQL
```

## ⚡ Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Orquestación | Turborepo + pnpm | Monorepo y cacheo |
| Base de Datos | Neon (Postgres) | Serverless SQL |
| ORM | Drizzle | Type-safe queries |
| API | Hono.js | HTTP framework + RPC |
| Auth | Better Auth | Sesiones stateless |
| Dashboard | TanStack Start | SSR React |
| Landing/Blog | Astro | HTML estático |
| Docs | Starlight | Documentación |
| UI | Shadcn/ui + Tailwind | Componentes compartidos |
| Edge | Cloudflare Workers | Runtime edge-first |

## 🆘 ¿Necesitas ayuda?

Si encuentras algo confuso o crees que falta documentación, [abre un issue](https://github.com/LionsTheme/the-edge-stack/issues) en el repositorio.