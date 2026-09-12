import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const marqueeVariants = cva("relative w-full", {
  variants: {
    variant: {
      gradient:
        "[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [&[data-direction=bottom]]:[mask-image:linear-gradient(to_top,transparent,black_10%,black_90%,transparent)] [&[data-direction=bottom]]:[-webkit-mask-image:linear-gradient(to_top,transparent,black_10%,black_90%,transparent)] [&[data-direction=top]]:[mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] [&[data-direction=top]]:[-webkit-mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]",
      solid: "",
    },
  },
  defaultVariants: {
    variant: "gradient",
  },
})

type MarqueeProps = Omit<React.ComponentProps<"div">, "style"> &
  VariantProps<typeof marqueeVariants> & {
    direction?: "left" | "right" | "top" | "bottom"
    duration?: number | string
    gap?: string
    infinite?: boolean
    pauseOnHover?: boolean
    style?: React.CSSProperties
    time?: number | string
  }

function formatDuration(duration: number | string) {
  return typeof duration === "number" ? `${duration}s` : duration
}

function Marquee({
  children,
  className,
  direction = "left",
  duration,
  gap = "1rem",
  infinite = true,
  pauseOnHover = false,
  style,
  time = 30,
  variant,
  ...props
}: MarqueeProps) {
  const resolvedDuration = duration ?? time
  const marqueeStyle = {
    "--duration": formatDuration(resolvedDuration),
    "--gap": gap,
    ...style,
  } as React.CSSProperties

  const contentClassName = cn(
    "marquee-content flex min-w-full shrink-0 justify-around gap-[var(--gap)] will-change-transform group-data-[direction=bottom]:[animation-direction:reverse] group-data-[direction=right]:[animation-direction:reverse] data-[direction=bottom]:min-h-full data-[direction=bottom]:flex-col data-[direction=top]:min-h-full data-[direction=top]:flex-col motion-reduce:[animation-play-state:paused]",
    infinite &&
      "animate-[marquee-x_var(--duration,20s)_linear_infinite] group-data-[direction=bottom]:animate-[marquee-y_var(--duration,20s)_linear_infinite] group-data-[direction=top]:animate-[marquee-y_var(--duration,20s)_linear_infinite]",
    (direction === "top" || direction === "bottom") && "flex-col"
  )

  return (
    <div
      data-marquee
      data-direction={direction}
      data-pause-on-hover={pauseOnHover ? "true" : undefined}
      className={cn(
        "group flex w-full gap-[var(--gap)] overflow-hidden data-[direction=bottom]:flex-col data-[direction=top]:flex-col",
        marqueeVariants({ variant }),
        className
      )}
      style={marqueeStyle}
      {...props}
    >
      <style>
        {`@keyframes marquee-x{from{transform:translateX(0)}to{transform:translateX(calc(-100% - var(--gap)))}}@keyframes marquee-y{from{transform:translateY(0)}to{transform:translateY(calc(-100% - var(--gap)))}}[data-marquee][data-pause-on-hover="true"]:hover .marquee-content{animation-play-state:paused}`}
      </style>
      <div className={contentClassName}>{children}</div>
      {infinite ? (
        <div className={contentClassName} aria-hidden="true">
          {children}
        </div>
      ) : null}
    </div>
  )
}

export { Marquee, marqueeVariants }
