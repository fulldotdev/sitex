import type { ReactNode } from "react"

import {
  Layout,
  LayoutBody,
  LayoutHead,
  LayoutMain,
} from "@/components/ui/layout"

import { Sidebar1 } from "../blocks/sidebar-1"

import "@/styles/globals.css"

export type BaseProps = {
  title: string
  description: string
  path?: string
  children?: ReactNode
}

export const docsNavigation = [
  {
    href: "/docs/",
    label: "Introduction",
  },
  {
    href: "/docs/installation",
    label: "Installation",
  },
  {
    href: "/docs/page-routing",
    label: "Page routing",
  },
  {
    href: "/docs/island-rendering",
    label: "Island rendering",
  },
  {
    href: "/docs/folder-structure",
    label: "Folder structure",
  },
]

const global = {
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
  const page = {
    title,
    description,
    seo: {
      title,
      description,
    },
  }
  const breadcrumbItems = getPageBreadcrumbItems(path)

  return (
    <Layout>
      <LayoutHead {...global} {...page} {...page.seo} />
      <LayoutBody>
        <Sidebar1
          logo={global.logo}
          breadcrumb={{
            items: breadcrumbItems,
            menu: global.header.navigation,
          }}
          navigation={global.sidebar.navigation}
          githubRepo={global.header.githubRepo}
          path={path}
          client:load
        >
          <LayoutMain>{children}</LayoutMain>
        </Sidebar1>
      </LayoutBody>
    </Layout>
  )
}
