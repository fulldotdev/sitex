import type { PageContext } from "@fulldotdev/sitex"

export const render = "server"

export default async function Page({ request, url }: PageContext) {
  return (
    <html lang="en">
      <head>
        <title>SiteX server rendering test</title>
      </head>
      <body>
        <main>
          <h1>Server rendering test</h1>
          <p data-rendering-mode="server">server route rendered</p>
          <p data-request-present={request ? "yes" : "no"}>{url.pathname}</p>
        </main>
      </body>
    </html>
  )
}
