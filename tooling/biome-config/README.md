# 🧹 `@repo/biome-config`

Configuración centralizada de [Biome](https://biomejs.dev) para linting, formato y organización de imports compartida entre todas las apps y paquetes del monorepo.

## 🎯 ¿Por qué Biome?

Biome reemplaza ESLint + Prettier con una sola herramienta, más rápida y con configuración mínima. Soporta TypeScript, JSX, JSON y CSS out of the box.

## 🏗️ Estructura

```
biome.json         # Config base — todas las apps/paquetes
react.json         # Extiende base para apps React/JSX
cloudflare.json    # Extiende base para Workers (reglas más permisivas)
```

## 📋 Reglas configuradas

### Formato

| Regla | Valor |
|---|---|
| Indentación | Tabs, 2 espacios |
| Ancho de línea | 80 caracteres |
| Fin de línea | LF (Unix) |
| Comillas | Dobles (`"`) |
| Comillas JSX | Dobles (`"`) |
| Punto y coma | Siempre |
| Comas finales | Siempre (excepto JSON) |
| Paréntesis en arrow functions | Siempre |

### Linting

| Regla | Nivel | Descripción |
|---|---|---|
| `noUnusedVariables` | `error` | Variables no usadas (ignora prefijo `_`) |
| `noUnusedImports` | `error` | Imports no usados |
| `noExplicitAny` | `warn` | Uso de `any` explícito |
| `recommended` | `true` | Todas las reglas recomendadas de Biome |

### Asistencias

| Acción | Configuración |
|---|---|
| `organizeImports` | `on` — organiza imports al guardar |

### VCS

Integrado con Git — respeta `.gitignore` y excluye `dist/`, `build/`, `.output/`, `.next/`, `node_modules/`, `worker-configuration.d.ts`.

## 📦 Variantes

### `@repo/biome-config` (base)

Para paquetes sin JSX ni Workers. Usado por `packages/database`, `packages/api-types`, `packages/ui`, y tooling packages.

```jsonc
// biome.json
{ "extends": ["@repo/biome-config"] }
```

### `@repo/biome-config/react`

Extiende la base. Para apps con React/JSX: `apps/dash`.

```jsonc
// biome.json
{ "extends": ["@repo/biome-config/react"] }
```

### `@repo/biome-config/cloudflare`

Extiende la base con reglas más permisivas. `noUnusedVariables` y `noUnusedImports` bajan a `warn` porque Workers usa imports con efectos secundarios (`import "hono/cors"`). Usado por `apps/api` y `apps/gateway`.

```jsonc
// biome.json
{ "extends": ["@repo/biome-config/cloudflare"] }
```

## 🚀 Comandos

```bash
# En cualquier app/package
pnpm format       # Formatear código
pnpm lint         # Ejecutar linter
pnpm check        # Formato + lint juntos
```

Desde la raíz del monorepo:

```bash
pnpm check        # Ejecutar en todas las apps/paquetes
```

## ➕ Agregar reglas

Para agregar una regla que aplique a todos, editar `biome.json`:

```jsonc
{
  "linter": {
    "rules": {
      "style": {
        "useConst": "error",        // Preferir const sobre let
        "useTemplate": "error"      // Template literals sobre concatenación
      }
    }
  }
}
```

Para reglas específicas de un entorno, editar `react.json` o `cloudflare.json`.

## 🔗 Referencias

- [Biome CLI](https://biomejs.dev/reference/cli/)
- [Reglas de lint](https://biomejs.dev/linter/rules/)
- [Configuración](https://biomejs.dev/reference/configuration/)
