import { MenuIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Logo, LogoImage, LogoText } from "@/components/ui/logo"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type NavigationLink = {
  label: string
  href: string
}

type NavigationGroup = {
  label: string
  href?: string
  links?: readonly NavigationLink[]
}

type MobileNav1Props = {
  className?: string
  logo: {
    label: string
    href: string
  }
  navigation: readonly NavigationGroup[]
  path: string
}

function normalizePath(path: string) {
  if (path === "/") return path

  return path.replace(/\/$/, "")
}

function getNavigationItems(group: NavigationGroup): readonly NavigationLink[] {
  if (group.links) return group.links
  if (group.href) return [{ label: group.label, href: group.href }]

  return []
}

/**
 * Menu button and slide-in navigation for small screens. Hydrate it with
 * `client:media` so desktop visitors never download it.
 */
function MobileNav1({ className, logo, navigation, path }: MobileNav1Props) {
  const currentPath = normalizePath(path)

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            aria-label="Open navigation"
            className={className}
            size="icon-sm"
            variant="ghost"
          />
        }
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent className="w-72 gap-0 p-0" side="left">
        <SheetHeader className="border-b">
          <SheetTitle>
            <Logo className="gap-2" href={logo.href}>
              <LogoImage className="size-6" />
              <LogoText>{logo.label}</LogoText>
            </Logo>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation
          </SheetDescription>
        </SheetHeader>
        <nav
          aria-label="Site navigation"
          className="flex flex-col gap-6 overflow-y-auto p-4"
        >
          {navigation.map((group) => (
            <div className="flex flex-col gap-1" key={group.label}>
              <p className="px-2 text-xs font-medium text-muted-foreground">
                {group.label}
              </p>
              {getNavigationItems(group).map((item) => {
                const isActive = normalizePath(item.href) === currentPath

                return (
                  <a
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted hover:text-foreground",
                      isActive
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground"
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </a>
                )
              })}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

export { MobileNav1, type MobileNav1Props }
