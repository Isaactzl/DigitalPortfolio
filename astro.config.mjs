import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { lampScriptHash } from './src/data/lamp-script.ts';

export default defineConfig({
  site: 'https://isaactzl.github.io',
  base: '/DigitalPortfolio',
  trailingSlash: 'always',
  integrations: [sitemap()],
  // Stylesheets are inlined so first paint doesn't wait on extra requests; Astro hashes
  // every inline style and script it writes into the CSP below. Scripts stay as files.
  build: { inlineStylesheets: 'always' },
  vite: { build: { assetsInlineLimit: 0 } },
  security: {
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "media-src 'self'",
        'frame-src https://www.youtube-nocookie.com',
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
      ],
      scriptDirective: { resources: ["'self'"], hashes: [lampScriptHash] },
      styleDirective: { resources: ["'self'"] },
    },
  },
});
