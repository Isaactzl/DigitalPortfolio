import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://isaactzl.github.io',
  base: '/DigitalPortfolio',
  trailingSlash: 'always',
  integrations: [sitemap()],
  // Every script and stylesheet ships as its own file so the CSP can stay at 'self'.
  build: { inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
});
