import { cva, type VariantProps } from "class-variance-authority"
import { XIcon } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

const bannerVariants = cva("relative flex items-center py-2", {
  variants: {
    variant: {
      default: "w-full bg-foreground text-background",
      floating:
        "mx-auto my-2 w-[calc(100%-2rem)] max-w-[calc(var(--container,1280px)-2rem)] overflow-hidden rounded-lg border bg-background shadow-sm",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

type BannerProps = React.ComponentProps<"aside"> &
  VariantProps<typeof bannerVariants> & {
    storageKey?: string
  }

function getBannerStorageToken(key: string) {
  return `banner:${key}`
}

function Banner({
  className,
  variant,
  storageKey,
  hidden,
  ...props
}: BannerProps) {
  const [isHidden, setIsHidden] = React.useState(false)

  React.useEffect(() => {
    if (!storageKey) return
    setIsHidden(
      window.sessionStorage.getItem(getBannerStorageToken(storageKey)) ===
        "hidden"
    )
  }, [storageKey])

  return (
    <aside
      data-slot="banner"
      data-banner-storage-key={storageKey}
      data-variant={variant}
      className={cn(bannerVariants({ variant }), className)}
      hidden={hidden || isHidden}
      {...props}
    />
  )
}

function BannerContainer({
  className,
  showClose = true,
  onClose,
  ...props
}: React.ComponentProps<"div"> & {
  showClose?: boolean
  onClose?: React.MouseEventHandler<HTMLButtonElement>
}) {
  const handleClose: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClose?.(event)
    if (event.defaultPrevented) return

    const banner = event.currentTarget.closest<HTMLElement>(
      "[data-slot='banner']"
    )

    if (!banner) return

    banner.hidden = true

    const storageKey = banner.dataset.bannerStorageKey

    if (storageKey) {
      window.sessionStorage.setItem(getBannerStorageToken(storageKey), "hidden")
    }
  }

  return (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-7xl gap-4 px-4",
        showClose && "pr-10",
        className
      )}
      {...props}
    >
      {props.children}
      {showClose ? (
        <button
          type="button"
          className="focus-visible:ring-ring/50 absolute top-1/2 right-4 z-20 inline-flex shrink-0 -translate-y-1/2 items-center justify-center rounded-sm text-current/65 transition-colors outline-none hover:text-current focus-visible:text-current focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 in-data-[variant=floating]:right-5"
          aria-label="Close"
          data-slot="banner-close"
          onClick={handleClose}
        >
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </button>
      ) : null}
    </div>
  )
}

export { Banner, BannerContainer, bannerVariants }
