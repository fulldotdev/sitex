"use client"

import { type ReactNode } from "react"
import { ChevronDownIcon, ExternalLinkIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Header, HeaderContainer, HeaderGroup } from "@/components/ui/header"
import { Logo, LogoImage, LogoText } from "@/components/ui/logo"
import { Separator } from "@/components/ui/separator"
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
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ThemeProvider } from "@/components/theme-provider"

type NavigationGroup = {
  label: string
  href?: string
  links?: {
    label: string
    href: string
  }[]
}

type Sidebar1Props = {
  className?: string
  logo: {
    label: string
    href: string
  }
  breadcrumb: {
    items: {
      label: string
      href: string
    }[]
    menu: {
      label: string
      href: string
    }[]
  }
  navigation: NavigationGroup[]
  githubRepo: string
  path: string
  children?: ReactNode
}

function normalizePath(path: string) {
  if (path === "/") return path

  return path.replace(/\/$/, "")
}

function toDomId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "")
}

function Sidebar1({
  className,
  logo,
  breadcrumb,
  navigation,
  githubRepo,
  path,
  children,
}: Sidebar1Props) {
  const currentPath = normalizePath(path)

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
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
                <LogoImage aria-label="x" className="size-6" />
                <LogoText className="truncate">Sitex</LogoText>
              </Logo>
            </SidebarMenuButton>
          </SidebarHeader>
          <SidebarContent className="mask-[linear-gradient(to_bottom,transparent,black_1rem,black_calc(100%-1rem),transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_1rem,black_calc(100%-1rem),transparent)] group-data-[collapsible=icon]:mask-none group-data-[collapsible=icon]:[-webkit-mask-image:none]">
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
                <SidebarTrigger />
                <Separator
                  orientation="vertical"
                  className="my-auto mr-2 h-4"
                />
                <Breadcrumb className="hidden md:block">
                  <BreadcrumbList>
                    <BreadcrumbTrail
                      breadcrumb={breadcrumb}
                      currentPath={currentPath}
                    />
                  </BreadcrumbList>
                </Breadcrumb>
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
                <ThemeToggle />
              </HeaderGroup>
            </HeaderContainer>
          </Header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  )
}

function getNavigationItems(group: NavigationGroup) {
  if (group.links) return group.links
  if (group.href) return [{ label: group.label, href: group.href }]

  return []
}

function BreadcrumbTrail({
  breadcrumb,
  currentPath,
}: {
  breadcrumb: Sidebar1Props["breadcrumb"]
  currentPath: string
}) {
  return (
    <>
      {breadcrumb.items.map((item, index) => {
        const isLast = index === breadcrumb.items.length - 1
        const isHome = item.href === "/"
        const hasMenu =
          !isHome &&
          breadcrumb.menu.some(
            (menuItem) =>
              normalizePath(menuItem.href) === normalizePath(item.href)
          )

        return (
          <BreadcrumbFragment
            currentPath={currentPath}
            hasMenu={hasMenu}
            isLast={isLast}
            item={item}
            key={`${item.href}-${index}`}
            menu={breadcrumb.menu}
            showSeparator={index > 0}
          />
        )
      })}
      {breadcrumb.menu.length > 0 && currentPath === "/" ? (
        <>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Open page menu"
                className="hover:text-foreground inline-flex items-center leading-none transition-colors"
                id="breadcrumb-page-menu"
              >
                <BreadcrumbEllipsis />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  {breadcrumb.menu.map((item) => (
                    <a
                      className="hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
                      href={item.href}
                      key={item.href}
                    >
                      {item.label}
                    </a>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>
        </>
      ) : null}
    </>
  )
}

function BreadcrumbFragment({
  currentPath,
  hasMenu,
  isLast,
  item,
  menu,
  showSeparator,
}: {
  currentPath: string
  hasMenu: boolean
  isLast: boolean
  item: { label: string; href: string }
  menu: { label: string; href: string }[]
  showSeparator: boolean
}) {
  return (
    <>
      {showSeparator ? <BreadcrumbSeparator>/</BreadcrumbSeparator> : null}
      <BreadcrumbItem>
        {hasMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-current={isLast ? "page" : undefined}
              aria-label={`${item.label} pages`}
              className={cn(
                "hover:text-foreground inline-flex items-center gap-1 transition-colors",
                isLast && "text-foreground"
              )}
              id={`breadcrumb-menu-${toDomId(item.href)}`}
            >
              {item.label}
              <ChevronDownIcon className="size-3.5 opacity-70" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                {menu.map((menuItem) => (
                  <a
                    aria-current={
                      normalizePath(menuItem.href) === currentPath
                        ? "page"
                        : undefined
                    }
                    className="hover:bg-accent hover:text-accent-foreground aria-[current=page]:text-foreground flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
                    href={menuItem.href}
                    key={menuItem.href}
                  >
                    {menuItem.label}
                  </a>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : isLast ? (
          <BreadcrumbPage>{item.label}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink render={<a href={item.href} />}>
            {item.label}
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>
    </>
  )
}

export { Sidebar1, type Sidebar1Props }
