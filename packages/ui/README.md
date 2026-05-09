# 🎨 `@repo/ui` — Componentes Compartidos

Librería de componentes UI construida con [shadcn/ui](https://ui.shadcn.com) v4 + [Tailwind CSS](https://tailwindcss.com) v4. Basada en [Base UI](https://base-ui.com/react) para accesibilidad.

## 🏗️ Estructura

```
src/
└── components/
    └── button.tsx    # Ejemplo: componente Button con variantes
```

## 🚀 Uso

```tsx
import { Button } from "@repo/ui/components/button";

<Button variant="outline">Click me</Button>
```

## ➕ Agregar componentes

```bash
# Desde la raíz del monorepo
cd packages/ui
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add input
```

Los componentes se agregan en `src/components/` y están disponibles para todas las apps.

## 🎨 Tokens de diseño

Los tokens CSS (colores, tipografía, radius) están definidos en `@repo/tailwind-config` y se comparten entre todas las apps vía `@import` en los archivos CSS.
