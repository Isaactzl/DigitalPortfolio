# Security

If you find a security problem with this site or repo, please email me at isaac.tan0207@gmail.com rather than opening a public issue. I'll reply within a few days and credit you in the fix if you'd like.

## What's in scope

- The site at [isaactzl.github.io/DigitalPortfolio](https://isaactzl.github.io/DigitalPortfolio/) and this repository.
- Anything that lets code run on the site that I didn't ship, leaks personal data, or weakens the build and deploy workflows.

## What's already in place

- A strict Content Security Policy with SHA-256 hashes and no `unsafe-inline`. The browser tests fail on any violation.
- No third-party scripts. Three.js and the fonts are bundled at build time.
- GitHub Actions pinned to commit hashes, with the narrowest permissions each job needs.
- Dependabot, CodeQL and `npm audit` on every change.

## Known limits

GitHub Pages can't send custom response headers, so `frame-ancestors`, `X-Content-Type-Options` and a header-based CSP aren't possible here. The CSP is delivered in a `<meta>` tag instead. The write-up is in the [hardening case study](https://isaactzl.github.io/DigitalPortfolio/work/hardening-this-site/).
