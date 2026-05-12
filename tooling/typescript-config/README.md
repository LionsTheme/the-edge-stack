# ⚙️ `@repo/typescript-config`

Shared base TypeScript configurations across all apps and packages.

## Files

| File | Usage |
|---|---|
| `base.json` | Base config (strict, ES2022, bundler resolution) |
| `react.json` | Extends base + JSX for React apps |
| `cloudflare.json` | Extends base + Cloudflare Workers types |
| `astro.json` | Extends base + Astro configuration |

## Usage

```jsonc
// tsconfig.json in any app/package
{
  "extends": "@repo/typescript-config/react.json"
}
```