# 🎨 `@repo/tailwind-config`

Centralized [Tailwind CSS v4](https://tailwindcss.com) configuration with shared design tokens across all apps.

## Usage

Each app imports this configuration in its `app.css`:

```css
@import "@repo/tailwind-config";
```

## Tokens

CSS tokens (colors, typography, spacing, radius) are defined here and inherited by all apps. This ensures visual consistency across the entire monorepo.