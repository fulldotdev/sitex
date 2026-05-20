---
type: none-load
seo:
  title: No output, client load
  description: A page body rendered only in the browser.
title: No output, client load
description: This route renders the shell HTML, then mounts the page body in the browser.
output: none
client: load
newsletter:
  title: Client-only page
  buttonLabel: Submit
---

This mode is closest to Astro `client:only` for the page body.

- The shell still renders HTML.
- The page body is not rendered to HTML.
- The page body mounts from the page client script.
