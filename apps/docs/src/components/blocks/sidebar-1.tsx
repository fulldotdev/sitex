import { type ReactNode } from "react"

import { ExternalLinkIcon } from "lucide-react"

import { MobileNav1 } from "@/components/blocks/mobile-nav-1"
import { Button } from "@/components/ui/button"
import { Header, HeaderContainer, HeaderGroup } from "@/components/ui/header"
import { Logo, LogoImage, LogoText } from "@/components/ui/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { theme } from "@/lib/theme"
import { cn } from "@/lib/utils"

type NavigationGroup = {
  label: string
  href?: string
  links?: readonly {
    label: string
    href: string
  }[]
}

type SidebarSection = {
  label: string
  href: string
  navigation: readonly NavigationGroup[]
}

type Sidebar1Props = {
  className?: string
  logo: {
    label: string
    href: string
  }
  sections: readonly SidebarSection[]
  githubRepo: string
  path: string
  children?: ReactNode
}

function normalizePath(path: string) {
  if (path === "/") return path

  return path.replace(/\/$/, "")
}

function findActiveSection(
  sections: readonly SidebarSection[],
  currentPath: string
) {
  const matches = sections.filter((section) => {
    const sectionPath = normalizePath(section.href)

    return (
      currentPath === sectionPath || currentPath.startsWith(`${sectionPath}/`)
    )
  })

  return matches.sort((a, b) => b.href.length - a.href.length)[0] ?? sections[0]
}

/**
 * Static docs shell. The sidebar and header render as plain HTML; only the
 * mobile navigation and the theme toggle hydrate, each as its own island.
 */
function Sidebar1({
  className,
  logo,
  sections,
  githubRepo,
  path,
  children,
}: Sidebar1Props) {
  const currentPath = normalizePath(path)
  const activeSection = findActiveSection(sections, currentPath)
  const navigation = activeSection?.navigation ?? []

  return (
    <SidebarProvider className="font-sans antialiased">
      <Sidebar
        className={cn(className)}
        collapsible="offcanvas"
        variant="inset"
      >
        <SidebarHeader className="flex-col">
          <SidebarMenuButton
            render={<a href={logo.href} />}
            size="lg"
            variant="default"
          >
            <Logo className="gap-2">
              <LogoImage className="size-6" />
              <LogoText className="truncate">{logo.label}</LogoText>
            </Logo>
          </SidebarMenuButton>
          {sections.length > 1 ? (
            <div className="flex gap-1 rounded-lg bg-sidebar-accent/50 p-1">
              {sections.map((section) => (
                <a
                  key={section.href}
                  href={section.href}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1 text-center text-xs font-medium transition-colors",
                    section === activeSection
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {section.label}
                </a>
              ))}
            </div>
          ) : null}
        </SidebarHeader>
        <SidebarContent className="mask-[linear-gradient(to_bottom,transparent,black_1rem,black_calc(100%-1rem),transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_1rem,black_calc(100%-1rem),transparent)]">
          {navigation.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {getNavigationItems(group).map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={normalizePath(item.href) === currentPath}
                      render={<a href={item.href} />}
                    >
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header className="h-16 shrink-0 border-b">
          <HeaderContainer className="max-w-none justify-between gap-2">
            <HeaderGroup className="flex-1 md:flex-none">
              <MobileNav1
                className="md:hidden"
                logo={logo}
                navigation={navigation}
                path={path}
                client:media="(max-width: 767px)"
              />
            </HeaderGroup>
            <HeaderGroup className="gap-1">
              <Button
                aria-label={`View ${githubRepo} on GitHub`}
                nativeButton={false}
                render={
                  <a
                    href={`https://github.com/${githubRepo}`}
                    rel="noreferrer"
                    target="_blank"
                  />
                }
                size="sm"
                variant="ghost"
              >
                <ExternalLinkIcon />
                <span className="hidden sm:inline">GitHub</span>
              </Button>
              <ThemeToggle {...theme} client:idle />
            </HeaderGroup>
          </HeaderContainer>
        </Header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

function getNavigationItems(group: NavigationGroup) {
  if (group.links) return group.links
  if (group.href) return [{ label: group.label, href: group.href }]

  return []
}

export { Sidebar1, type Sidebar1Props }
