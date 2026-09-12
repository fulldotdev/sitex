import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const gradientVariants = cva(
  "pointer-events-none absolute inset-0 bg-primary opacity-50 [--gradient-stops:black,transparent]",
  {
    variants: {
      variant: {
        radial:
          "[mask-image:radial-gradient(ellipse_at_var(--gradient-position),var(--gradient-stops))] [-webkit-mask-image:radial-gradient(ellipse_at_var(--gradient-position),var(--gradient-stops))]",
        linear:
          "[mask-image:linear-gradient(var(--gradient-direction),var(--gradient-stops))] [-webkit-mask-image:linear-gradient(var(--gradient-direction),var(--gradient-stops))]",
      },
      direction: {
        left: "[--gradient-direction:to_left] [--gradient-position:0%_50%]",
        right: "[--gradient-direction:to_right] [--gradient-position:100%_50%]",
        top: "[--gradient-direction:to_top] [--gradient-position:50%_0%]",
        bottom:
          "[--gradient-direction:to_bottom] [--gradient-position:50%_100%]",
        center:
          "[--gradient-direction:to_bottom] [--gradient-position:50%_50%]",
      },
    },
    defaultVariants: {
      variant: "radial",
      direction: "bottom",
    },
  }
)

function Gradient({
  className,
  variant,
  direction,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof gradientVariants>) {
  return (
    <div
      data-slot="gradient"
      aria-hidden="true"
      className={cn(gradientVariants({ variant, direction }), className)}
      {...props}
    />
  )
}

export { Gradient, gradientVariants }
