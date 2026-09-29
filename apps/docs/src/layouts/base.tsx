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

import { Posthog } from "@/components/posthog"
import { Sidebar1 } from "@/components/blocks/sidebar-1"
import { ThemeScript } from "@/components/ui/theme-toggle"
import { globals } from "@/lib/globals"
import { theme } from "@/lib/theme"

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
      <LayoutHead
        {...head}
        name={globals.name}
        image={
          head.image || {
            src: "https://sitex.full.dev/social.png",
            alt: "SiteX",
            width: 1200,
            height: 630,
            type: "image/png",
          }
        }
      >
        <ThemeScript {...theme} />
      </LayoutHead>
      <LayoutBody>
        <Sidebar1
          logo={globals.logo}
          sections={globals.sidebar.sections}
          githubRepo={globals.header.githubRepo}
          path={path}
        >
          <LayoutMain className="min-h-0 flex-1 overflow-y-auto">
            {children}
          </LayoutMain>
        </Sidebar1>
        <Posthog client:idle />
      </LayoutBody>
    </Layout>
  )
}
