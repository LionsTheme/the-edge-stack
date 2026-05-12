# 🧪 `@repo/testing`

Shared test setup with [Vitest](https://vitest.dev) + [Cloudflare Workers pool](https://developers.cloudflare.com/workers/testing/vitest-integration/).

## Usage

Each app/package that needs tests extends this configuration:

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import { cloudflare } from "@repo/testing/setup";

export default defineConfig({
  plugins: [cloudflare()],
});
```