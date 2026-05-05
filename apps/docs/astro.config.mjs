import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [
    cloudflare(),
    starlight({
      title: 'The Edge Stack',
      social: {
        github: 'https://github.com/LionsTheme/the-edge-stack',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/getting-started/introduction/' },
            { label: 'Installation', link: '/getting-started/installation/' },
          ],
        },
        {
          label: 'Architecture',
          items: [
            { label: 'Stack Overview', link: '/architecture/overview/' },
            { label: 'API Design', link: '/architecture/api/' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
  outDir: './dist',
  base: '/docs',
});
