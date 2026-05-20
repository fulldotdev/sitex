---
type: server-none
seo:
  title: Server output, geen client
  description: Een pagina bedoeld voor request-time rendering zonder page-hydratie.
title: Server output, geen client
description: Deze pagina is bedoeld om per request te renderen zonder de page body te hydrateren.
output: server
client: none
newsletter:
  title: Server + geen client
  buttonLabel: Versturen
---

Deze modus is voor verse request-time page HTML zonder page-hydratie.

- In dev rendert Ostra deze pagina per request.
- De statische build slaat deze route over tot er een serveradapter is.
- De shell kan nog steeds hydrateren voor navigatiechrome.
- Er wordt geen page client-script geladen.
