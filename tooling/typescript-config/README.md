# ⚙️ `@repo/typescript-config`

Configuraciones base de TypeScript compartidas entre todas las apps y paquetes.

## Archivos

| Archivo | Uso |
|---|---|
| `base.json` | Config base (strict, ES2022, bundler resolution) |
| `react.json` | Extiende base + JSX para apps React |
| `cloudflare.json` | Extiende base + tipos de Cloudflare Workers |
| `astro.json` | Extiende base + configuración Astro |

## Uso

```jsonc
// tsconfig.json en cualquier app/package
{
  "extends": "@repo/typescript-config/react.json"
}
```
