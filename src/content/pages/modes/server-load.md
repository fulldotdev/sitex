---
type: server-load
seo:
  title: Server output, client load
  description: A page intended for request-time rendering with page hydration.
title: Server output, client load
description: This page is intended to render on each request and then hydrate the page body.
output: server
client: load
newsletter:
  title: Server + client
  buttonLabel: Submit
---

This mode is closest to classic SSR plus hydration.

- In dev, Ostra renders it on request.
- Static build skips this route until a server adapter exists.
- The Ostra shell hydrates independently.
- The page body hydrates too.
