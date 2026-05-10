# 🧪 `@repo/testing`

Setup de tests compartido con [Vitest](https://vitest.dev) + [Cloudflare Workers pool](https://developers.cloudflare.com/workers/testing/vitest-integration/).

## Uso

Cada app/package que necesite tests extiende esta configuración:

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import { cloudflare } from "@repo/testing/setup";

export default defineConfig({
  plugins: [cloudflare()],
});
```
