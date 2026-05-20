---
type: static-none
seo:
  title: Static output, no client
  description: A page rendered at build time without page hydration.
title: Static output, no client
description: This page is written to HTML during the static build and does not hydrate the page body.
output: static
client: none
newsletter:
  title: Static + no client
  buttonLabel: Submit
---

This is the leanest mode.

- HTML is generated during `pnpm run build`.
- Refreshing the page serves the same generated HTML.
- The shell can still hydrate for navigation chrome.
- No page client script is included.
