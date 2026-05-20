---
type: static-load
seo:
  title: Static output, client load
  description: A page rendered at build time that hydrates the page body.
title: Static output, client load
description: This page is written to HTML during the static build and then hydrates the page body.
output: static
client: load
newsletter:
  title: Static + client
  buttonLabel: Submit
---

This mode keeps static output but enables browser interaction.

- HTML is generated during `pnpm run build`.
- The Ostra shell hydrates independently.
- The page body hydrates too.
