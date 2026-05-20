---
type: none-load
seo:
  title: No output, client load
  description: Een page body die alleen in de browser rendert.
title: No output, client load
description: Deze route rendert de shell HTML en mount daarna de page body in de browser.
output: none
client: load
newsletter:
  title: Client-only page
  buttonLabel: Versturen
---

Deze modus lijkt op Astro `client:only` voor de page body.

- De shell rendert nog steeds HTML.
- De page body wordt niet naar HTML gerenderd.
- De page body mount via het page client-script.
