import { createHash } from 'node:crypto';

/**
 * Sets the lamp (light or dark) before first paint so the page never flashes the
 * wrong colours. It's inlined in the head, and the CSP allows exactly this text by
 * its hash, so both the layout and astro.config read it from here.
 */
export const lampScript =
  "(function(){var s;try{s=localStorage.getItem('lamp')}catch(e){}" +
  "var d=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches;" +
  "document.documentElement.dataset.lamp=s||(d?'on':'off')})()";

export const lampScriptHash = `sha256-${createHash('sha256').update(lampScript).digest('base64')}`;
