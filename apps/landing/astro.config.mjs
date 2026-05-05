import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [
    cloudflare(),
    tailwind({ applyBaseStyles: false }),
  ],
  outDir: './dist',
  base: '/',
});
