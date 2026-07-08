import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const tileVariants = cva(
  "group/tile focus-visible:border-ring focus-visible:ring-ring/50 flex min-w-0 flex-col overflow-hidden rounded-xl transition-colors outline-none group-data-[variant=masonry]/tile-group:mb-4 group-data-[variant=masonry]/tile-group:break-inside-avoid focus-visible:ring-3",
  {
    variants: {
      variant: {
        default:
          "border border-transparent text-foreground data-[link]:hover:bg-muted/40",
        inset:
          "-mx-5 border border-transparent text-foreground data-[link]:hover:bg-muted/40",
        outline:
          "border border-border bg-background text-foreground data-[link]:hover:bg-muted/40",
        muted:
          "border-transparent bg-muted/50 text-foreground data-[link]:hover:bg-muted/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const tileGroupVariants = cva("group/tile-group w-full gap-4", {
  variants: {
    variant: {
      default: "grid",
      masonry: "columns-1",
    },
    size: {
      sm: "",
      default: "",
      lg: "",
    },
  },
  compoundVariants: [
    {
      variant: "default",
      size: "sm",
      class: "grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]",
    },
    {
      variant: "default",
      size: "default",
      class: "grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]",
    },
    {
      variant: "default",
      size: "lg",
      class: "grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(400px,1fr))]",
    },
    {
      variant: "masonry",
      size: "sm",
      class: "sm:[column-count:5] sm:[column-width:240px]",
    },
    {
      variant: "masonry",
      size: "default",
      class: "sm:[column-count:4] sm:[column-width:300px]",
    },
    {
      variant: "masonry",
      size: "lg",
      class: "sm:[column-count:3] sm:[column-width:400px]",
    },
  ],
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

type TileProps = VariantProps<typeof tileVariants> &
  React.ComponentProps<"div"> &
  React.ComponentProps<"a"> & {
    href?: string
  }

function Tile({ className, variant, href, ...props }: TileProps) {
  const Comp = href ? "a" : "div"

  return (
    <Comp
      data-slot="tile"
      data-variant={variant}
      data-link={href ? "" : undefined}
      className={cn(tileVariants({ variant }), className)}
      href={href}
      {...props}
    />
  )
}

function TileGroup({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof tileGroupVariants>) {
  return (
    <div
      role="list"
      data-slot="tile-group"
      data-variant={variant}
      data-size={size}
      className={cn(tileGroupVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function TileContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tile-content"
      className={cn("flex min-w-0 flex-1 flex-col gap-3 p-5", className)}
      {...props}
    />
  )
}

export { Tile, TileContent, TileGroup, tileGroupVariants, tileVariants }
