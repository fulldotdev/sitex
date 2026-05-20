---
type: server-none
seo:
  title: Server output, no client
  description: A page intended for request-time rendering without page hydration.
title: Server output, no client
description: This page is intended to render on each request without hydrating the page body.
output: server
client: none
newsletter:
  title: Server + no client
  buttonLabel: Submit
---

This mode is for fresh request-time page HTML without page hydration.

- In dev, Ostra renders it on request.
- Static build skips this route until a server adapter exists.
- The shell can still hydrate for navigation chrome.
- No page client script is included.
