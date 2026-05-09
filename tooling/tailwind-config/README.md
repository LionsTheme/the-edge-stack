# 🎨 `@repo/tailwind-config`

Configuración centralizada de [Tailwind CSS v4](https://tailwindcss.com) con tokens de diseño compartidos entre todas las apps.

## Uso

Cada app importa esta configuración en su `app.css`:

```css
@import "@repo/tailwind-config";
```

## Tokens

Los tokens CSS (colores, tipografía, spacing, radius) se definen aquí y se heredan en todas las apps. Esto asegura consistencia visual en todo el monorepo.
