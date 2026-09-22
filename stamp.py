#!/usr/bin/env python3
"""Stamp cache-busting versions onto every same-origin asset URL in each page.

The origin sends `Cache-Control: public, max-age=2592000, immutable` for static
files. That is only safe when the URL changes whenever the bytes change. With a
fixed name like styles.css or assets/og.jpg, Cloudflare and visitors' browsers
keep serving the old copy for 30 days and never revalidate — which is exactly
how the redesign shipped with the previous stylesheet still attached.

Covers plain href/src, srcset candidates, and absolute URLs in meta tags
(og:image, twitter:image), so social scrapers refetch the card too.

Run after changing any of these files and before deploying. Idempotent.
"""
import hashlib
import pathlib
import re

PAGES = [pathlib.Path("index.html"), pathlib.Path("work.html")]
SITE = "https://devali.cloud/"

ASSETS = [
    "styles.css",
    "script.js",
    "favicon.svg",
    "assets/og.jpg",
    "assets/portrait-344.jpg",
    "assets/portrait-344.webp",
    "assets/portrait-688.jpg",
    "assets/portrait-688.webp",
]

# Structured data must keep stable canonical image URLs: search engines use them
# as identifiers, and a hash that changes every deploy just forces a re-crawl.
# Caching is a browser/CDN concern, so only the rendered markup gets stamped.
LD = re.compile(r'(<script type="application/ld\+json">.*?</script>)', re.S)

for HTML in PAGES:
    if not HTML.exists():
        print(f"{HTML} MISSING — skipped")
        continue

    parts = LD.split(HTML.read_text())
    total = 0
    print(f"{HTML}:")

    for name in ASSETS:
        path = pathlib.Path(name)
        if not path.exists():
            print(f"  {name:26s} MISSING — skipped")
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()[:8]

        # Every occurrence of the path, relative or absolute, with any existing
        # ?v= replaced rather than appended to.
        pattern = re.compile(
            r"(" + re.escape(SITE) + r"|(?<=[\"'\s,]))"
            + re.escape(name)
            + r"(?:\?v=[0-9a-f]+)?(?=[\"'\s,])"
        )
        n = 0
        for i, part in enumerate(parts):
            if LD.fullmatch(part):
                continue                  # leave the JSON-LD block untouched
            parts[i], hits = pattern.subn(lambda m: f"{m.group(1)}{name}?v={digest}", part)
            n += hits
        total += n
        print(f"  {name:26s} v={digest}  ({n} reference{'s' if n != 1 else ''})")

    HTML.write_text("".join(parts))
    print(f"  stamped — {total} URLs (JSON-LD left canonical)")
