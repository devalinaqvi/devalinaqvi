# Syed Muhammad Ali — Portfolio

A single-page personal portfolio, hand-built with plain HTML, CSS, and ~25 lines
of JavaScript. No framework, no build step, no dependencies, no tracking.

## Run locally

Any static file server works:

```sh
cd portfolio
python3 -m http.server 8080
# open http://localhost:8080
```

## Structure

```
index.html      All content and metadata (Open Graph, JSON-LD structured data)
styles.css      Full design system: tokens, layout, responsive, reduced-motion
script.js       Mobile navigation toggle only
favicon.svg     Monogram favicon
assets/
  portrait-*.{webp,jpg}   Responsive editorial portrait (480w / 800w)
  fonts/                  Self-hosted Fraunces + Inter (latin, variable, woff2)
robots.txt      Crawl rules + sitemap pointer
sitemap.xml     Single-URL sitemap
```

## Before deploying

The site is deployed at `https://devali.cloud/`
domain. Search for it and replace with the real domain in:

- `index.html` — canonical link, Open Graph / Twitter URLs, JSON-LD `@id`/`url`/image URLs
- `robots.txt` — sitemap URL
- `sitemap.xml` — page URL

Everything else is relative and works from any host (GitHub Pages, Netlify,
any Nginx/Apache box).

## Editing content

All copy lives in `index.html`, one section per `<section>` element. Design
tokens (colors, spacing, type) are CSS custom properties at the top of
`styles.css`.
