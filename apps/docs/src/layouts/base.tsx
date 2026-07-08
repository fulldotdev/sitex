import type { LayoutProps } from "@fulldotdev/sitex"
import type { ReactNode } from "react"

import {
  Layout,
  LayoutBody,
  LayoutHead,
  LayoutMain,
  type LayoutHeadProps,
} from "@/components/ui/layout"

import "@/index.css"

import { Sidebar1 } from "@/components/blocks/sidebar-1"
import { globals } from "@/lib/globals"

export type BaseLayoutProps = LayoutHeadProps & {
  path: LayoutProps["path"]
  url: LayoutProps["url"]
  locale: LayoutProps["locale"]
  headings?: LayoutProps["headings"]
  children?: ReactNode
}

export default function BaseLayout({
  children,
  headings: _headings,
  locale: _locale,
  path,
  url: _url,
  ...head
}: BaseLayoutProps) {
  return (
    <Layout>
      <LayoutHead {...head} name={globals.name}>
        {/* Apply the stored theme before first paint to avoid a flash. Must
            mirror the ThemeProvider defaults in blocks/sidebar-1.tsx. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("vite-ui-theme")||"dark";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.add(d?"dark":"light")}catch(e){}})()`,
          }}
        />
      </LayoutHead>
      <LayoutBody>
        <Sidebar1
          logo={globals.logo}
          sections={globals.sidebar.sections}
          githubRepo={globals.header.githubRepo}
          path={path}
          client:idle
        >
          <LayoutMain className="min-h-0 flex-1 overflow-y-auto">
            {children}
          </LayoutMain>
        </Sidebar1>
      </LayoutBody>
    </Layout>
  )
}
