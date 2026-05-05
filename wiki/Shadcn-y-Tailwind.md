# Shadcn/ui y Tailwind CSS

## ¿Qué es Shadcn/ui?

**Shadcn/ui** no es una librería de componentes. Es una colección de componentes React que copias directamente en tu proyecto:

- **Sin dependencia:** Los componentes son tuyos, puedes modificarlos
- **Basado en Radix:** Accesibilidad incluida
- **Tailwind-native:** Estilos con utilidades CSS
- **TypeScript:** 100% tipado

## 📦 Paquete UI Compartido

```
packages/ui/
├── src/
│   ├── lib/
│   │   └── utils.ts        # cn() helper
│   ├── components/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   └── styles.css          # Variables CSS
├── tailwind.config.ts
└── package.json
```

## 🔧 El Helper `cn()`

```ts
// packages/ui/src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**¿Para qué sirve?**

```tsx
// Sin cn
className={`base-class ${isActive ? 'active' : ''} ${className}`}

// Con cn
className={cn("base-class", isActive && "active", className)}
```

- `clsx`: Condicionales limpias
- `tailwind-merge`: Evita conflictos de clases (ej: `px-2 px-4` → `px-4`)

## 🎨 Tokens de Diseño

Los tokens se definen en CSS Custom Properties:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --radius: 0.5rem;
}
```

**Uso en Tailwind:**

```tsx
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground rounded-lg">
    Click
  </button>
</div>
```

## 🆕 Agregar Nuevos Componentes

1. Copia el componente desde [ui.shadcn.com](https://ui.shadcn.com)
2. Pégalo en `packages/ui/src/components/`
3. Exporta en `packages/ui/src/index.ts`
4. Instala dependencias si las necesita

```bash
# Ejemplo: si el componente necesita un hook
pnpm --filter @repo/ui add @radix-ui/react-dialog
```

## 🔗 Uso en otras Apps

```tsx
// apps/dashboard/src/pages/index.tsx
import { Button, Card, Input } from "@repo/ui";

export function Page() {
  return (
    <Card>
      <Input placeholder="Escribe algo..." />
      <Button>Enviar</Button>
    </Card>
  );
}
```