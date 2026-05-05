# Astro Starlight

## ¿Qué es Starlight?

**Starlight** es un tema de documentación para Astro. Es la alternativa moderna a Docusaurus:

- Construido sobre Astro (mismo stack que landing/blog)
- Navegación automática basada en archivos
- Búsqueda integrada
- Soporte para i18n
- Temas claros/oscuros
- Compatible con MDX

## 📁 Estructura

```
apps/docs/
├── astro.config.mjs       # Config con sidebar
├── src/
│   ├── styles/
│   │   └── custom.css     # Tokens de diseño compartidos
│   └── content/
│       └── docs/
│           ├── index.mdx           # Página de inicio
│           ├── getting-started/
│           │   ├── introduction.md
│           │   └── installation.md
│           └── architecture/
│               ├── overview.md
│               └── api.md
```

## ⚙️ Configuración

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'The Edge Stack',
      social: {
        github: 'https://github.com/LionsTheme/the-edge-stack',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/getting-started/introduction/' },
            { label: 'Installation', link: '/getting-started/installation/' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
  base: '/docs',  // Se sirve bajo /docs/*
});
```

## 🎨 Compartir Diseño

```css
/* src/styles/custom.css */
@import "@repo/tailwind-config/tokens.css";

:root {
  --sl-color-accent: hsl(var(--primary));
  --sl-color-accent-high: hsl(var(--primary-foreground));
}
```

Starlight usa CSS Custom Properties que puedes sobrescribir para alinear con tu paleta de colores.

## 🚀 Despliegue

```bash
cd apps/docs
pnpm build
```

Los archivos estáticos se generan en `dist/`.