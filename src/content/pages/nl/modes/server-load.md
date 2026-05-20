---
type: server-load
seo:
  title: Server output, client load
  description: Een pagina bedoeld voor request-time rendering met page-hydratie.
title: Server output, client load
description: Deze pagina is bedoeld om per request te renderen en daarna de page body te hydrateren.
output: server
client: load
newsletter:
  title: Server + client
  buttonLabel: Versturen
---

Deze modus lijkt het meest op klassieke SSR plus hydratie.

- In dev rendert Ostra deze pagina per request.
- De statische build slaat deze route over tot er een serveradapter is.
- De Ostra shell hydrateert los van de page body.
- De page body hydrateert ook.
