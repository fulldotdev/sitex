import type { ComponentProps, ElementType } from "react"

import { cn } from "@/lib/utils"

function Toc({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      data-slot="toc"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

type TocTitleProps<T extends ElementType = "p"> = {
  as?: T
} & Omit<ComponentProps<T>, "as">

function TocTitle<T extends ElementType = "p">({
  as,
  className,
  ...props
}: TocTitleProps<T>) {
  const Tag = as ?? "p"

  return (
    <Tag
      data-slot="toc-title"
      className={cn("text-sm font-medium tracking-tight", className)}
      {...props}
    />
  )
}

function TocMenu({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="toc-menu"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

function TocMenuItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="toc-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  )
}

type TocMenuLinkProps = ComponentProps<"a"> & {
  depth?: number
  isActive?: boolean
  active?: boolean
}

function TocMenuLink({
  className,
  depth = 2,
  isActive,
  active = false,
  ...props
}: TocMenuLinkProps) {
  const resolvedActive = isActive ?? active

  return (
    <a
      data-slot="toc-menu-link"
      data-depth={depth}
      data-active={resolvedActive ? "true" : undefined}
      aria-current={resolvedActive ? "location" : undefined}
      className={cn(
        "block text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground data-[active=true]:text-foreground",
        depth === 3 && "pl-4",
        depth >= 4 && "pl-8",
        className
      )}
      {...props}
    />
  )
}

export { Toc, TocMenu, TocMenuItem, TocMenuLink, TocTitle }
