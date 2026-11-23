---
no: '005'
title: Hardening this site
status: Shipped
kind: Security · This repo
stack: [Git, Content Security Policy, Astro, Playwright]
summary: Before inviting anyone to poke at this site, I went through it like an attacker would. Personal data out of git history, no third-party scripts, and a strict CSP that the tests enforce.
cover: ../../assets/projects/hardening-this-site.svg
coverAlt: Terminal output showing the site's Content-Security-Policy, an empty git history for the old CV, and zero third-party scripts, next to a padlock.
bench: lock
---

## Why

I knew someone would open DevTools on this site, read the repo, and maybe run a scanner against it. So I looked at it the way they would, starting with what it gave away.

## Personal data in git history

My old CV had my home address on it. I'd replaced the PDF long ago, but git keeps every version, so anyone browsing old commits could still download it.

- Rewrote the history with `git filter-repo` to drop every old version of the CV, after taking a backup.
- Reworded an old commit message that named where I'm posted for NS.
- Force-pushing wasn't enough. GitHub keeps old commits reachable by their hash for a while, so I deleted the repo and recreated it from the cleaned history.
- Added a `.gitignore` so drafts, the CV's source file and raw videos can't be committed by accident.

The public CV now says "Singapore Armed Forces" and nothing more specific.

## Nothing runs that I didn't ship

The old site loaded its 3D viewer straight from a CDN, with no integrity check. If that CDN had been compromised, it could have run anything on my page.

Now Three.js and the fonts are bundled at build time, and the page loads no scripts from anywhere else. The only outside content is the YouTube player, and only after you press Play, from `youtube-nocookie.com`.

## A strict Content Security Policy

Every page carries a CSP that only allows scripts, styles and fonts from this site. There is no `unsafe-inline`. The page's CSS and the few lines that set dark or light mode are inlined so the first paint is fast, and each one is allowed by its exact SHA-256 hash, written into the policy when the site is built. Change a single character and the browser blocks it.

The browser tests listen for CSP violations and fail if a single one happens, so the policy can't quietly break later.

## Keeping the dependencies honest

`npm audit` runs against everything. When a Lighthouse testing package pulled in several high-severity advisories, I dropped it and ran Lighthouse through its GitHub Action instead, which keeps it out of the project entirely.

The build pipeline gets the same treatment. Every GitHub Action is pinned to an exact commit rather than a version tag, since a tag can be moved to point at different code. Each job only gets the permissions it needs: only the deploy job can publish the site, and the build that feeds it doesn't reuse a shared dependency cache. Dependabot keeps the pins current.

## What's still open

GitHub Pages can't send custom HTTP headers, so protections like `frame-ancestors` aren't possible yet. The fix is putting the site behind Cloudflare, and that's next.
