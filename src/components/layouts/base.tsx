import type { ReactNode } from "react"

import { Sidebar1 } from "@/components/blocks/sidebar-1"

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

const themeInitScript = `
(() => {
  const storageKey = "vite-ui-theme";

  const disableTransitions = () => {
    const style = document.createElement("style");
    style.appendChild(
      document.createTextNode(
        "*,*::before,*::after{transition:none!important}"
      )
    );
    document.head.appendChild(style);

    window.getComputedStyle(document.documentElement);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        style.remove();
      });
    });
  };

  try {
    const storedTheme = localStorage.getItem(storageKey) || "dark";
    const resolvedTheme =
      storedTheme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : storedTheme;

    disableTransitions();
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(resolvedTheme);
  } catch {
  }
})();
`

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
      className="bg-background text-foreground has-data-[variant=inset]:bg-sidebar overscroll-none scroll-smooth"
      data-slot="layout"
      lang="en"
    >
      <head>
        <meta charSet="utf-8" />
        <script
          dangerouslySetInnerHTML={{
            __html: themeInitScript,
          }}
        />
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
            className="@container flex flex-col in-data-[slot=sidebar-inset]:rounded-[inherit]"
            data-slot="layout-main"
          >
            {children}
          </main>
        </Sidebar1>
      </body>
    </html>
  )
}
