import type { ReactNode } from "react"
import { getPage } from "sitex:content"

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

const docsPagePaths = [
  "/docs",
  "/docs/installation",
  "/docs/page-routing",
  "/docs/content",
  "/docs/island-rendering",
  "/docs/folder-structure",
]

const docsPages = await Promise.all(docsPagePaths.map((path) => getPage(path)))

export const docsNavigation: NavigationLink[] = docsPages
  .filter((page) => page !== undefined)
  .map((page) => ({
    href: page.path,
    label: page.content.title,
  }))

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
      className="dark bg-background text-foreground has-data-[variant=inset]:bg-sidebar overscroll-none scroll-smooth"
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
        className="bg-background text-foreground overscroll-none antialiased"
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
          client:load
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
