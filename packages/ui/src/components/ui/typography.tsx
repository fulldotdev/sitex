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
      className={cn(
        "text-base text-foreground",
        // Vertical rhythm between direct children.
        "[&>:is(p,blockquote,ul,ol,table,div,section,article,aside,nav,figure,details,pre,small,dl,img,picture,video,iframe):not(:first-child)]:mt-6",
        "[&>h2:not(:first-child)]:mt-10",
        "[&>:is(h3,h4):not(:first-child)]:mt-8",
        "[&>:is(h1,h2,h3,h4)+:is(p,blockquote,ul,ol,table,div,section,article,aside,nav,figure,details,pre,small,dl,img,picture,video,iframe)]:mt-4",
        "[&>hr]:my-8 [&>hr]:border-border",
        // Raw elements (e.g. rendered MDX) get the same styling the
        // Typography* components carry themselves; [data-slot] elements are
        // excluded so those components stay in charge of their own styling.
        "[&_h1:not([data-slot])]:scroll-m-20 [&_h1:not([data-slot])]:font-semibold [&_h1:not([data-slot])]:tracking-tight [&_h1:not([data-slot])]:text-balance",
        "[&[data-size=sm]_h1:not([data-slot])]:text-3xl [&[data-size=default]_h1:not([data-slot])]:text-4xl [&[data-size=lg]_h1:not([data-slot])]:text-5xl",
        "[&_h2:not([data-slot])]:scroll-m-20 [&_h2:not([data-slot])]:font-semibold [&_h2:not([data-slot])]:tracking-tight",
        "[&[data-size=sm]_h2:not([data-slot])]:text-2xl [&[data-size=default]_h2:not([data-slot])]:text-3xl [&[data-size=lg]_h2:not([data-slot])]:text-4xl",
        "[&_h3:not([data-slot])]:scroll-m-20 [&_h3:not([data-slot])]:font-semibold [&_h3:not([data-slot])]:tracking-tight",
        "[&[data-size=sm]_h3:not([data-slot])]:text-xl [&[data-size=default]_h3:not([data-slot])]:text-2xl [&[data-size=lg]_h3:not([data-slot])]:text-3xl",
        "[&_h4:not([data-slot])]:scroll-m-20 [&_h4:not([data-slot])]:font-semibold [&_h4:not([data-slot])]:tracking-tight",
        "[&[data-size=sm]_h4:not([data-slot])]:text-lg [&[data-size=default]_h4:not([data-slot])]:text-xl [&[data-size=lg]_h4:not([data-slot])]:text-2xl",
        "[&_a:not([data-slot])]:font-medium [&_a:not([data-slot])]:text-primary [&_a:not([data-slot])]:underline [&_a:not([data-slot])]:underline-offset-4",
        "[&_p:not([data-slot])]:text-base [&_p:not([data-slot])]:leading-7",
        "[&_blockquote:not([data-slot])]:border-l-2 [&_blockquote:not([data-slot])]:pl-6 [&_blockquote:not([data-slot])]:text-base [&_blockquote:not([data-slot])]:italic",
        "[&_:is(ul,ol):not([data-slot])]:ml-6 [&_:is(ul,ol):not([data-slot])]:text-base [&_ul:not([data-slot])]:list-disc [&_ol:not([data-slot])]:list-decimal [&_:is(ul,ol)>li:not([data-slot])]:mt-2",
        "[&>small]:block [&>small]:text-sm [&>small]:leading-none [&>small]:font-medium",
        "[&_:not(pre)>code:not([data-slot])]:relative [&_:not(pre)>code:not([data-slot])]:rounded [&_:not(pre)>code:not([data-slot])]:bg-muted [&_:not(pre)>code:not([data-slot])]:px-[0.3rem] [&_:not(pre)>code:not([data-slot])]:py-[0.2rem] [&_:not(pre)>code:not([data-slot])]:font-mono [&_:not(pre)>code:not([data-slot])]:text-sm",
        "[&_table:not([data-slot])]:w-full [&_table:not([data-slot])]:caption-bottom [&_table:not([data-slot])]:border-spacing-0 [&_table:not([data-slot])]:overflow-x-auto [&_table:not([data-slot])]:rounded-xl [&_table:not([data-slot])]:border [&_table:not([data-slot])]:border-border [&_table:not([data-slot])]:text-sm",
        "[&_tr:not([data-slot])]:border-b [&_tr:not([data-slot])]:transition-colors [&_tbody_tr:not([data-slot]):last-child]:border-b-0",
        "[&_th:not([data-slot])]:h-10 [&_th:not([data-slot])]:px-2 [&_th:not([data-slot])]:text-left [&_th:not([data-slot])]:align-middle [&_th:not([data-slot])]:text-sm [&_th:not([data-slot])]:font-medium [&_th:not([data-slot])]:whitespace-nowrap [&_th:not([data-slot])]:text-foreground",
        "[&_th[align=center]:not([data-slot])]:text-center [&_th[align=right]:not([data-slot])]:text-right",
        "[&_td:not([data-slot])]:p-2 [&_td:not([data-slot])]:text-left [&_td:not([data-slot])]:align-middle [&_td:not([data-slot])]:text-sm [&_td:not([data-slot])]:whitespace-nowrap",
        "[&_td[align=center]:not([data-slot])]:text-center [&_td[align=right]:not([data-slot])]:text-right",
        "[&_table:not([data-slot])_:not(pre)>code:not([data-slot])]:rounded-md [&_table:not([data-slot])_:not(pre)>code:not([data-slot])]:leading-5",
        // Code blocks, including shiki-highlighted MDX output.
        "[&>pre]:overflow-x-auto [&>pre]:rounded-xl [&>pre]:border [&>pre]:border-border [&>pre]:bg-muted/60 [&>pre]:p-4 [&>pre]:text-sm",
        "[&>pre.shiki]:leading-(--text-sm--line-height) [&>pre.shiki_code]:text-inherit",
        "dark:[&>pre.shiki]:[color:var(--shiki-dark,var(--foreground))]",
        "dark:[&>pre.shiki_span[style*='--shiki-dark']]:[color:var(--shiki-dark)] dark:[&>pre.shiki_span[style*='--shiki-dark']]:[font-style:var(--shiki-dark-font-style,inherit)] dark:[&>pre.shiki_span[style*='--shiki-dark']]:[font-weight:var(--shiki-dark-font-weight,inherit)] dark:[&>pre.shiki_span[style*='--shiki-dark']]:[text-decoration:var(--shiki-dark-text-decoration,inherit)]",
        className
      )}
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
