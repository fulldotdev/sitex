import * as React from "react"
import type { Graph, Thing, WithContext } from "schema-dts"

import { cn } from "@/lib/utils"

function Layout({ className, ...props }: React.ComponentProps<"html">) {
  return (
    <html
      className={cn(
        "has-data-[variant=inset]:bg-sidebar scroll-smooth bg-background text-foreground overscroll-none",
        className
      )}
      data-slot="layout"
      {...props}
    />
  )
}

function LayoutBody({ className, ...props }: React.ComponentProps<"body">) {
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

function LayoutMain({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="layout-main"
      className={cn(
        "@container flex flex-col in-data-[slot=sidebar-inset]:rounded-[inherit]",
        className
      )}
      {...props}
    />
  )
}

type LayoutJsonLd = Graph | WithContext<Thing>

type LayoutHeadProps = Omit<React.ComponentProps<"head">, "title"> & {
  name?: string
  title?: string
  description?: string
  image?:
    | string
    | {
        src: string
        alt?: string
        width?: number
        height?: number
        type?: string
      }
  jsonLd?: LayoutJsonLd | readonly LayoutJsonLd[]
  openGraphType?: string
  publishedAt?: string
  type?: string
  twitterCard?: "summary" | "summary_large_image"
  updatedAt?: string
}

function LayoutHead({
  children,
  name,
  title,
  description,
  image,
  jsonLd,
  openGraphType,
  publishedAt,
  type,
  twitterCard,
  updatedAt,
  ...props
}: LayoutHeadProps) {
  const imageProps = typeof image === "string" ? { src: image } : image
  const resolvedOpenGraphType = openGraphType ?? type

  return (
    <head data-slot="layout-head" {...props}>
      {title ? <title>{title}</title> : null}
      {description ? <meta name="description" content={description} /> : null}
      {title ? <meta property="og:title" content={title} /> : null}
      {description ? (
        <meta property="og:description" content={description} />
      ) : null}
      {resolvedOpenGraphType ? (
        <meta property="og:type" content={resolvedOpenGraphType} />
      ) : null}
      {name ? <meta property="og:site_name" content={name} /> : null}
      {imageProps?.src ? (
        <meta property="og:image" content={imageProps.src} />
      ) : null}
      {imageProps?.alt ? (
        <meta property="og:image:alt" content={imageProps.alt} />
      ) : null}
      {imageProps?.width ? (
        <meta property="og:image:width" content={String(imageProps.width)} />
      ) : null}
      {imageProps?.height ? (
        <meta property="og:image:height" content={String(imageProps.height)} />
      ) : null}
      {imageProps?.type ? (
        <meta property="og:image:type" content={imageProps.type} />
      ) : null}
      {resolvedOpenGraphType === "article" && publishedAt ? (
        <meta property="article:published_time" content={publishedAt} />
      ) : null}
      {resolvedOpenGraphType === "article" && updatedAt ? (
        <meta property="article:modified_time" content={updatedAt} />
      ) : null}
      {twitterCard ? <meta name="twitter:card" content={twitterCard} /> : null}
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJson(jsonLd) }}
        />
      ) : null}
      {children}
    </head>
  )
}

function serializeJson(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c")
}

export { Layout, LayoutBody, LayoutHead, LayoutMain }
export type { LayoutHeadProps, LayoutJsonLd }
