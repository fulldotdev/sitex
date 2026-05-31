import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

type LayoutHeadProps = ComponentProps<"head"> & {
  name?: string
  title?: string
  description?: string
  logo?: unknown
  header?: unknown
  sidebar?: unknown
  seo?: unknown
  image?: {
    src?: string
    alt?: string
  }
  noindex?: boolean
  nofollow?: boolean
  canonical?: string
  children?: ReactNode
}

function Layout({ className, lang = "en", ...props }: ComponentProps<"html">) {
  return (
    <html
      className={cn(
        "bg-background text-foreground has-data-[variant=inset]:bg-sidebar overscroll-none scroll-smooth",
        className
      )}
      data-slot="layout"
      lang={lang}
      {...props}
    />
  )
}

function LayoutHead({
  name,
  title,
  description,
  logo: _logo,
  header: _header,
  sidebar: _sidebar,
  seo: _seo,
  image,
  noindex,
  nofollow,
  canonical,
  children,
  ...props
}: LayoutHeadProps) {
  const robots =
    noindex || nofollow
      ? [noindex ? "noindex" : "index", nofollow ? "nofollow" : "follow"].join(
          ", "
        )
      : undefined

  return (
    <head data-slot="layout-head" {...props}>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      {title ? <title>{title}</title> : null}
      {description ? <meta name="description" content={description} /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      {robots ? <meta name="robots" content={robots} /> : null}
      {title ? <meta property="og:title" content={title} /> : null}
      {description ? (
        <meta property="og:description" content={description} />
      ) : null}
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      {name ? <meta property="og:site_name" content={name} /> : null}
      <meta property="og:type" content="website" />
      {image?.src ? <meta property="og:image" content={image.src} /> : null}
      {image?.alt ? <meta property="og:image:alt" content={image.alt} /> : null}
      {children}
    </head>
  )
}

function LayoutBody({ className, ...props }: ComponentProps<"body">) {
  return (
    <body
      className={cn(
        "bg-background text-foreground overscroll-none antialiased",
        className
      )}
      data-slot="layout-body"
      {...props}
    />
  )
}

function LayoutMain({ className, ...props }: ComponentProps<"main">) {
  return (
    <main
      className={cn(
        "@container flex flex-col in-data-[slot=sidebar-inset]:rounded-[inherit]",
        className
      )}
      data-slot="layout-main"
      {...props}
    />
  )
}

export { Layout, LayoutBody, LayoutHead, LayoutMain }
