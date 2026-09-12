import { StarIcon } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

function Rating({
  className,
  value = 5,
  ...props
}: React.ComponentProps<"div"> & {
  value?: number
}) {
  return (
    <div
      className={cn("flex items-center gap-1 text-base", className)}
      {...props}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const fillPercentage =
          index < Math.floor(value)
            ? 100
            : index === Math.floor(value)
              ? (value % 1) * 100
              : 0

        return (
          <span
            className="relative inline-flex size-[1em] text-muted-foreground/25"
            key={index}
          >
            <StarIcon className="size-[1em] fill-current" />
            {fillPercentage > 0 ? (
              <span
                className="absolute inset-0 overflow-hidden text-primary"
                style={{ width: `${fillPercentage}%` }}
              >
                <StarIcon className="size-[1em] fill-current" />
              </span>
            ) : null}
          </span>
        )
      })}
    </div>
  )
}

export { Rating }
