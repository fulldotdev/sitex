import { type ComponentProps, type HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type LogoProps = HTMLAttributes<HTMLElement> & {
  href?: string
}

type LogoImageProps = ComponentProps<"span">

function Logo({ className, href, ...props }: LogoProps) {
  const classes = cn(
    "flex h-10 items-center justify-start gap-0 text-base font-semibold whitespace-nowrap",
    className
  )

  if (href) {
    return <a className={classes} href={href} {...props} />
  }

  return <div className={classes} {...props} />
}

function LogoImage({ className, ...props }: LogoImageProps) {
  return (
    <span
      className={cn("inline-flex size-[30px] shrink-0 text-current", className)}
      data-slot="logo-image"
      {...props}
    >
      <svg
        aria-hidden="true"
        className="size-full!"
        fill="none"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="7" fill="#ff5e00" />
        <path
          d="M6.8 6.6 16 12.7l9.2-6.1-6.1 9.4 6.1 9.4-9.2-6.1-9.2 6.1 6.1-9.4z"
          fill="#ffffff"
          transform="translate(16 16) scale(1.12) translate(-16 -16)"
        />
      </svg>
    </span>
  )
}

function LogoText({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn("text-lg", className)} {...props} />
}

export { Logo, LogoImage, LogoText }
