# 🧹 `@repo/biome-config`

Centralized [Biome](https://biomejs.dev) configuration for linting, formatting, and import organization shared across all apps and packages in the monorepo.

## 🎯 Why Biome?

Biome replaces ESLint + Prettier with a single, faster tool with minimal configuration. Supports TypeScript, JSX, JSON, and CSS out of the box.

## 🏗️ Structure

```
biome.json         # Base config — all apps/packages
react.json         # Extends base for React/JSX apps
cloudflare.json    # Extends base for Workers (more permissive rules)
```

## 📋 Configured Rules

### Formatting

| Rule | Value |
|---|---|
| Indentation | Tabs, 2 spaces |
| Line width | 80 characters |
| Line endings | LF (Unix) |
| Quotes | Double (`"`) |
| JSX Quotes | Double (`"`) |
| Semicolons | Always |
| Trailing commas | Always (except JSON) |
| Arrow function parentheses | Always |

### Linting

| Rule | Level | Description |
|---|---|---|
| `noUnusedVariables` | `error` | Unused variables (ignores `_` prefix) |
| `noUnusedImports` | `error` | Unused imports |
| `noExplicitAny` | `warn` | Explicit `any` usage |
| `recommended` | `true` | All recommended Biome rules |

### Assists

| Action | Configuration |
|---|---|
| `organizeImports` | `on` — organizes imports on save |

### VCS

Integrated with Git — respects `.gitignore` and excludes `dist/`, `build/`, `.output/`, `.next/`, `node_modules/`, `worker-configuration.d.ts`.

## 📦 Variants

### `@repo/biome-config` (base)

For packages without JSX or Workers. Used by `packages/database`, `packages/api-types`, `packages/ui`, and tooling packages.

```jsonc
// biome.json
{ "extends": ["@repo/biome-config"] }
```

### `@repo/biome-config/react`

Extends base. For apps with React/JSX: `apps/dash`.

```jsonc
// biome.json
{ "extends": ["@repo/biome-config/react"] }
```

### `@repo/biome-config/cloudflare`

Extends base with more permissive rules. `noUnusedVariables` and `noUnusedImports` are set to `warn` because Workers use imports with side effects (`import "hono/cors"`). Used by `apps/api` and `apps/gateway`.

```jsonc
// biome.json
{ "extends": ["@repo/biome-config/cloudflare"] }
```

## 🚀 Commands

```bash
# In any app/package
pnpm format       # Format code
pnpm lint         # Run linter
pnpm check        # Format + lint together
```

From the monorepo root:

```bash
pnpm check        # Run in all apps/packages
```

## ➕ Adding Rules

To add a rule that applies to everyone, edit `biome.json`:

```jsonc
{
  "linter": {
    "rules": {
      "style": {
        "useConst": "error",        // Prefer const over let
        "useTemplate": "error"      // Template literals over concatenation
      }
    }
  }
}
```

For environment-specific rules, edit `react.json` or `cloudflare.json`.

## 🔗 References

- [Biome CLI](https://biomejs.dev/reference/cli/)
- [Lint rules](https://biomejs.dev/linter/rules/)
- [Configuration](https://biomejs.dev/reference/configuration/)