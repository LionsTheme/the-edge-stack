# 🎨 `@repo/ui` — Shared Components

UI component library built with [shadcn/ui](https://ui.shadcn.com) v4 + [Tailwind CSS](https://tailwindcss.com) v4. Based on [Base UI](https://base-ui.com/react) for accessibility.

## 🏗️ Structure

```
src/
└── components/
    └── button.tsx    # Example: Button component with variants
```

## 🚀 Usage

```tsx
import { Button } from "@repo/ui/components/button";

<Button variant="outline">Click me</Button>
```

## ➕ Adding Components

```bash
# From the monorepo root
cd packages/ui
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add input
```

Components are added in `src/components/` and are available to all apps.

## 🎨 Design Tokens

CSS tokens (colors, typography, radius) are defined in `@repo/tailwind-config` and are shared across all apps via `@import` in CSS files.