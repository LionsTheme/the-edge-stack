# Astro

## ¿Qué es Astro?

**Astro** es un framework para construir sitios web de contenido:

- **Islas de hidratación:** Solo hidrata los componentes interactivos
- **Zero JS by default:** El HTML se envía puro, sin JavaScript
- **Multi-framework:** Soporta React, Vue, Svelte, Solid, etc.
- **Content Collections:** Sistema type-safe para MD/MDX

## 📁 Estructura

```
apps/landing/ (o apps/blog/)
├── src/
│   ├── layouts/
│   │   └── Layout.astro    # Layout base
│   └── pages/
│       └── index.astro     # Página principal
├── astro.config.mjs
└── package.json
```

## 📝 Componente Astro

Los componentes Astro (`.astro`) son HTML con superpoderes:

```astro
---
// Código JavaScript/TypeScript (server-side)
const title = "The Edge Stack";
const features = ["Fast", "Secure", "Scalable"];
---

<!-- Template HTML -->
<main class="container">
  <h1>{title}</h1>
  <ul>
    {features.map(f => <li>{f}</li>)}
  </ul>
</main>

<style>
  .container { max-width: 800px; margin: 0 auto; }
</style>
```

**Partes de un componente Astro:**

1. **Frontmatter (`---`)**: Código que se ejecuta en el servidor
2. **Template**: HTML con expresiones JSX-like
3. **Styles**: CSS scoped al componente

## 🎨 Integración con Tailwind

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind({ applyBaseStyles: false })],
});
```

```astro
---
---

<style is:global>
  @import "@repo/tailwind-config/tokens.css";
</style>

<body class="min-h-screen bg-background text-foreground">
  <slot />
</body>
```

## 📄 Blog con Content Collections

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    heroImage: z.string().optional(),
  }),
});

export const collections = { posts };
```

## 🚀 Despliegue

```bash
cd apps/landing
pnpm build
# Genera dist/ con archivos estáticos
```

Despliega `dist/` en cualquier host estático:
- Cloudflare Pages
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront