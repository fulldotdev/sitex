import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const headerVariants = cva(
  "relative z-50 flex w-full items-center gap-4 py-2",
  {
    variants: {
      variant: {
        default: "",
        floating:
          "mx-auto my-2 w-[calc(100%-2rem)] max-w-[calc(var(--container,1280px)-2rem)] overflow-hidden rounded-lg border bg-background shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Header({
  className,
  variant,
  ...props
}: React.ComponentProps<"header"> & VariantProps<typeof headerVariants>) {
  return (
    <header
      data-slot="header"
      data-variant={variant}
      className={cn(headerVariants({ variant }), className)}
      {...props}
    />
  )
}

function HeaderContainer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="header-container"
      className={cn(
        "relative mx-auto flex w-full max-w-7xl gap-4 px-4",
        className
      )}
      {...props}
    />
  )
}

function HeaderGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="header-group"
      className={cn("flex min-w-0 items-center gap-2", className)}
      {...props}
    />
  )
}

export { Header, HeaderContainer, HeaderGroup }
