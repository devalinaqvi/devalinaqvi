#!/usr/bin/env python3
"""Stamp cache-busting versions onto same-origin asset URLs in index.html.

The server sends `Cache-Control: public, max-age=2592000, immutable` for static
files. That is only safe when the URL changes whenever the bytes change — with
a fixed name like styles.css, browsers and the CDN keep serving the old copy
for 30 days and never revalidate.

Run this after editing styles.css / script.js / favicon.svg and before deploying.
"""
import hashlib, pathlib, re

HTML = pathlib.Path("index.html")
ASSETS = ["styles.css", "script.js", "favicon.svg"]

html = HTML.read_text()
for name in ASSETS:
    digest = hashlib.sha256(pathlib.Path(name).read_bytes()).hexdigest()[:8]
    # Match the asset in href="" / src="", with or without an existing ?v=
    pattern = re.compile(r'((?:href|src)=")' + re.escape(name) + r'(?:\?v=[0-9a-f]+)?(")')
    html, n = pattern.subn(lambda m: f"{m.group(1)}{name}?v={digest}{m.group(2)}", html)
    print(f"  {name:14s} v={digest}  ({n} reference{'s' if n != 1 else ''})")

HTML.write_text(html)
print("index.html stamped")
