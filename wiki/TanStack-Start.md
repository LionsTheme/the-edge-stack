# TanStack Start

## ⚠️ Advertencia de Madurez

TanStack Start está actualmente en **beta**. La API puede cambiar significativamente. Si necesitas estabilidad máxima, considera migrar a **Next.js App Router** manteniendo Hono como API.

## ¿Qué es TanStack Start?

**TanStack Start** es un framework full-stack basado en:

- **TanStack Router:** Router type-safe para React
- **Vite:** Bundler ultrarrápido
- **SSR:** Server-Side Rendering con hidratación parcial

## 📁 Estructura

```
apps/dashboard/
├── app/
│   ├── client.tsx      # Entry point del cliente
│   ├── ssr.tsx         # Entry point del servidor
│   ├── router.tsx      # Configuración del router
│   ├── app.config.ts   # Config de TanStack Start
│   ├── app.css         # Estilos globales
│   └── routes/
│       ├── __root.tsx  # Layout raíz
│       ├── index.tsx   # Ruta /
│       └── posts.tsx   # Ruta /posts
├── vite.config.ts
└── package.json
```

## 🛣️ Router File-Based

TanStack Start usa un router basado en archivos (como Next.js):

```tsx
// app/routes/index.tsx → URL: /
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return <h1>Dashboard Home</h1>;
}
```

```tsx
// app/routes/posts.tsx → URL: /posts
export const Route = createFileRoute('/posts')({
  component: PostsPage,
});
```

## 🔄 Layout Raíz

```tsx
// app/routes/__root.tsx
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/posts">Posts</Link>
      </nav>
      <Outlet /> {/* Aquí se renderizan las rutas hijas */}
    </div>
  );
}
```

## 📡 Consumir API

```tsx
// app/routes/posts.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

function PostsPage() {
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await api.api.posts.$get();
      return res.json();
    },
  });

  return (
    <div>
      {data?.posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
        </article>
      ))}
    </div>
  );
}
```

---

## 🚀 Despliegue

```bash
cd apps/dashboard
pnpm build
```

El build genera archivos estáticos en `.output/` que puedes desplegar en:
- Cloudflare Pages (`wrangler pages deploy .output`)
- Vercel
- Netlify
- Cualquier CDN estático