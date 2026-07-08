import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const sectionVariants = cva(
  "relative flex scroll-mt-12 flex-col gap-16 py-16",
  {
    variants: {
      variant: {
        default: "w-full bg-background",
        floating:
          "mx-auto my-16 w-[calc(100%-2rem)] max-w-[calc(var(--container,1280px)-2rem)] overflow-hidden rounded-xl border bg-background shadow-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Section({
  className,
  variant,
  ...props
}: React.ComponentProps<"section"> & VariantProps<typeof sectionVariants>) {
  return (
    <section
      data-slot="section"
      data-variant={variant}
      className={cn(sectionVariants({ variant }), className)}
      {...props}
    />
  )
}

function SectionContainer({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="section-container"
      className={cn(
        "relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4",
        className
      )}
      {...props}
    />
  )
}

export { Section, SectionContainer, sectionVariants }
