import * as React from "react"

import { cn } from "@/lib/utils"

type TypographySize = "sm" | "default" | "lg"

type TypographyProps<T extends React.ElementType = "div"> = {
  as?: T
  size?: TypographySize
  className?: string
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "size">

function Typography<T extends React.ElementType = "div">({
  as,
  className,
  size = "default",
  ...props
}: TypographyProps<T>) {
  const Component = as ?? "div"

  return (
    <Component
      data-slot="typography"
      data-size={size}
      className={cn("text-base text-foreground", className)}
      {...props}
    />
  )
}

function TypographyA({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      data-slot="typography-a"
      className={cn(
        "font-medium text-primary underline underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

function TypographyBlockquote({
  className,
  ...props
}: React.ComponentProps<"blockquote">) {
  return (
    <blockquote
      data-slot="typography-blockquote"
      className={cn("border-l-2 pl-6 text-base italic", className)}
      {...props}
    />
  )
}

function TypographyH1({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"h1"> & { size?: TypographySize }) {
  return (
    <h1
      data-slot="typography-h1"
      data-size={size}
      className={cn(
        "scroll-m-20 font-semibold tracking-tight text-balance",
        size === "sm" && "text-3xl",
        size === "default" && "text-4xl",
        size === "lg" && "text-5xl",
        className
      )}
      {...props}
    />
  )
}

function TypographyH2({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"h2"> & { size?: TypographySize }) {
  return (
    <h2
      data-slot="typography-h2"
      data-size={size}
      className={cn(
        "scroll-m-20 font-semibold tracking-tight",
        size === "sm" && "text-2xl",
        size === "default" && "text-3xl",
        size === "lg" && "text-4xl",
        className
      )}
      {...props}
    />
  )
}

function TypographyH3({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"h3"> & { size?: TypographySize }) {
  return (
    <h3
      data-slot="typography-h3"
      data-size={size}
      className={cn(
        "scroll-m-20 font-semibold tracking-tight",
        size === "sm" && "text-xl",
        size === "default" && "text-2xl",
        size === "lg" && "text-3xl",
        className
      )}
      {...props}
    />
  )
}

function TypographyH4({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"h4"> & { size?: TypographySize }) {
  return (
    <h4
      data-slot="typography-h4"
      data-size={size}
      className={cn(
        "scroll-m-20 font-semibold tracking-tight",
        size === "sm" && "text-lg",
        size === "default" && "text-xl",
        size === "lg" && "text-2xl",
        className
      )}
      {...props}
    />
  )
}

function TypographyInlineCode({
  className,
  ...props
}: React.ComponentProps<"code">) {
  return (
    <code
      data-slot="typography-inline-code"
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm",
        className
      )}
      {...props}
    />
  )
}

function TypographyLead({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="typography-lead"
      className={cn("text-lg text-muted-foreground", className)}
      {...props}
    />
  )
}

type TypographyListProps = React.HTMLAttributes<
  HTMLUListElement | HTMLOListElement
> & {
  as?: "ul" | "ol"
}

function TypographyList({
  as: Component = "ul",
  className,
  ...props
}: TypographyListProps) {
  return (
    <Component
      data-slot="typography-list"
      data-ordered={Component === "ol" ? "" : undefined}
      className={cn(
        "ml-6 text-base",
        Component === "ol" ? "list-decimal" : "list-disc",
        className
      )}
      {...props}
    />
  )
}

function TypographyListItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="typography-list-item"
      className={cn("mt-2", className)}
      {...props}
    />
  )
}

function TypographyP({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="typography-p"
      className={cn("text-base leading-7", className)}
      {...props}
    />
  )
}

function TypographyTable({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<"table"> & { containerClassName?: string }) {
  return (
    <div
      data-slot="typography-table-container"
      className={cn(
        "w-full overflow-x-auto rounded-xl border border-border",
        containerClassName
      )}
    >
      <table
        data-slot="typography-table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TypographyTableCell({
  className,
  align,
  ...props
}: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="typography-table-cell"
      align={align}
      className={cn(
        "p-2 align-middle text-sm whitespace-nowrap",
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left",
        className
      )}
      {...props}
    />
  )
}

function TypographyTableHead({
  className,
  align,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="typography-table-head"
      align={align}
      className={cn(
        "h-10 px-2 align-middle text-sm font-medium whitespace-nowrap text-foreground",
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left",
        className
      )}
      {...props}
    />
  )
}

function TypographyTableRow({
  className,
  ...props
}: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="typography-table-row"
      className={cn("border-b transition-colors last:border-b-0", className)}
      {...props}
    />
  )
}

export {
  Typography,
  TypographyA,
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyLead,
  TypographyList,
  TypographyListItem,
  TypographyP,
  TypographyTable,
  TypographyTableCell,
  TypographyTableHead,
  TypographyTableRow,
}
