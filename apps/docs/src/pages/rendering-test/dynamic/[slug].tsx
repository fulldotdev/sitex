import type { PageContext, StaticPaths } from "@fulldotdev/sitex"

type Props = {
  label: string
}

export const paths = [
  { params: { slug: "alpha" }, props: { label: "Alpha" } },
  { params: { slug: "beta" }, props: { label: "Beta" } },
] satisfies StaticPaths<Props>

export default function Page({ params, props }: PageContext<Props>) {
  return (
    <html lang="en">
      <head>
        <title>SiteX dynamic static rendering test</title>
      </head>
      <body>
        <main>
          <h1>Dynamic static rendering test</h1>
          <p data-rendering-mode="dynamic-static">
            dynamic static route rendered
          </p>
          <p data-slug={params.slug}>{props.label}</p>
        </main>
      </body>
    </html>
  )
}
