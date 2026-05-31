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
      className={cn("text-foreground text-base", className)}
      {...props}
    />
  )
}

function TypographyA({ className, ...props }: React.ComponentProps<"a">) {
  return <a data-slot="typography-a" className={cn(className)} {...props} />
}

function TypographyBlockquote({
  className,
  ...props
}: React.ComponentProps<"blockquote">) {
  return (
    <blockquote
      data-slot="typography-blockquote"
      className={cn(className)}
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
      className={cn(className)}
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
      className={cn(className)}
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
      className={cn(className)}
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
      className={cn(className)}
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
      className={cn(className)}
      {...props}
    />
  )
}

function TypographyLead({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="typography-lead" className={cn(className)} {...props} />
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
      className={cn(className)}
      {...props}
    />
  )
}

function TypographyListItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li data-slot="typography-list-item" className={cn(className)} {...props} />
  )
}

function TypographyP({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="typography-p" className={cn(className)} {...props} />
}

function TypographyTable({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<"table"> & { containerClassName?: string }) {
  return (
    <div
      data-slot="typography-table-container"
      className={cn(containerClassName)}
    >
      <table
        data-slot="typography-table"
        className={cn(className)}
        {...props}
      />
    </div>
  )
}

function TypographyTableCell({
  className,
  ...props
}: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="typography-table-cell"
      className={cn(className)}
      {...props}
    />
  )
}

function TypographyTableHead({
  className,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="typography-table-head"
      className={cn(className)}
      {...props}
    />
  )
}

function TypographyTableRow({
  className,
  ...props
}: React.ComponentProps<"tr">) {
  return (
    <tr data-slot="typography-table-row" className={cn(className)} {...props} />
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
