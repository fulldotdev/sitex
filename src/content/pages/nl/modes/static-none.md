---
type: static-none
seo:
  title: Static output, geen client
  description: Een pagina die tijdens de build wordt gerenderd zonder page-hydratie.
title: Static output, geen client
description: Deze pagina wordt tijdens de statische build naar HTML geschreven en hydrateert de page body niet.
output: static
client: none
newsletter:
  title: Static + geen client
  buttonLabel: Versturen
---

Dit is de lichtste modus.

- HTML wordt gegenereerd tijdens `pnpm run build`.
- Verversen levert dezelfde gegenereerde HTML.
- De shell kan nog steeds hydrateren voor navigatiechrome.
- Er wordt geen page client-script geladen.
