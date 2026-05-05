import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [
    cloudflare(),
    tailwind({ applyBaseStyles: false }),
    mdx(),
  ],
  outDir: './dist',
  base: '/blog',
});
