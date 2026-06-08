import type { ReactNode } from "react"

import { Sidebar1 } from "@/components/blocks/sidebar-1"
import "@/styles/globals.css"

export type BaseProps = {
  title: string
  description: string
  path?: string
  children?: ReactNode
}

export type NavigationLink = {
  href: string
  label: string
}

export const docsNavigation: NavigationLink[] = [
  { href: "/docs", label: "Introduction" },
  { href: "/docs/installation", label: "Installation" },
  { href: "/docs/page-routing", label: "Page routing" },
  { href: "/docs/content", label: "Pages API" },
  { href: "/docs/rendering-and-assets", label: "Rendering and assets" },
  { href: "/docs/island-rendering", label: "Island rendering" },
  { href: "/docs/folder-structure", label: "Folder structure" },
]

const site = {
  name: "Sitex Docs",
  logo: {
    label: "Sitex",
    href: "/",
  },
  header: {
    githubRepo: "fulldotdev/sitex",
    navigation: docsNavigation,
  },
  sidebar: {
    navigation: [
      {
        label: "Documentation",
        links: docsNavigation,
      },
    ],
  },
}

function normalizePath(path: string) {
  if (path === "/") return path

  return path.replace(/\/$/, "")
}

function getPageBreadcrumbItems(path: string) {
  const currentPath = normalizePath(path)

  if (currentPath === "/") {
    return [{ label: "Home", href: "/" }]
  }

  const currentPage = docsNavigation.find(
    (item) => normalizePath(item.href) === currentPath
  )

  return [{ label: "Home", href: "/" }, ...(currentPage ? [currentPage] : [])]
}

export default function Base({
  title,
  description,
  path = "/",
  children,
}: BaseProps) {
  const breadcrumbItems = getPageBreadcrumbItems(path)

  return (
    <html
      className="dark overscroll-none scroll-smooth bg-background text-foreground has-data-[variant=inset]:bg-sidebar"
      data-slot="layout"
      lang="en"
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:site_name" content={site.name} />
        <meta property="og:type" content="website" />
      </head>
      <body
        className="overscroll-none bg-background text-foreground antialiased"
        data-slot="layout-body"
      >
        <Sidebar1
          logo={site.logo}
          breadcrumb={{
            items: breadcrumbItems,
            menu: site.header.navigation,
          }}
          navigation={site.sidebar.navigation}
          githubRepo={site.header.githubRepo}
          path={path}
          client:idle
        >
          <main
            className="@container flex min-h-0 flex-1 flex-col overflow-y-auto in-data-[slot=sidebar-inset]:rounded-[inherit]"
            data-slot="layout-main"
          >
            {children}
          </main>
        </Sidebar1>
      </body>
    </html>
  )
}
