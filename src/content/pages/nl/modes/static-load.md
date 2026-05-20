---
type: static-load
seo:
  title: Static output, client load
  description: Een pagina die tijdens de build wordt gerenderd en de page body hydrateert.
title: Static output, client load
description: Deze pagina wordt tijdens de statische build naar HTML geschreven en hydrateert daarna de page body.
output: static
client: load
newsletter:
  title: Static + client
  buttonLabel: Versturen
---

Deze modus houdt statische output, maar maakt interactie in de browser mogelijk.

- HTML wordt gegenereerd tijdens `pnpm run build`.
- De Ostra shell hydrateert los van de page body.
- De page body hydrateert ook.
