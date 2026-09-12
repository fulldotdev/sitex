import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

export interface FormatPriceValueOptions {
  currency: string
  locale: string
}

export type PriceValueType = number | string | [number, number]
export type DiscountFormat = "percentage" | "amount"

const priceValueVariants = cva("leading-tight", {
  variants: {
    variant: {
      default: "text-foreground",
      sale: "text-muted-foreground line-through",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function formatCurrency(value: number, options: FormatPriceValueOptions) {
  return new Intl.NumberFormat(options.locale, {
    style: "currency",
    currency: options.currency,
  }).format(value)
}

function parseSinglePriceValue(price: PriceValueType | null | undefined) {
  if (price === null || price === undefined || price === "") return null
  if (typeof price === "number") return Number.isFinite(price) ? price : null
  if (Array.isArray(price)) return null

  const numericValue = Number(price)
  return !Number.isNaN(numericValue) && Number.isFinite(numericValue)
    ? numericValue
    : null
}

function formatPriceDiscount(
  price: PriceValueType | null | undefined,
  compareAt: PriceValueType | null | undefined,
  options: FormatPriceValueOptions & {
    format?: DiscountFormat
  }
) {
  const currentPrice = parseSinglePriceValue(price)
  const originalPrice = parseSinglePriceValue(compareAt)

  if (
    currentPrice === null ||
    originalPrice === null ||
    originalPrice <= currentPrice ||
    originalPrice <= 0
  ) {
    return null
  }

  if (options.format === "amount") {
    return formatCurrency(originalPrice - currentPrice, options)
  }

  return `${Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}%`
}

function formatPriceValue(
  price: PriceValueType | null | undefined,
  options: FormatPriceValueOptions
) {
  if (price === null || price === undefined || price === "") return null
  if (typeof price === "number") return formatCurrency(price, options)

  if (Array.isArray(price)) {
    const [minimum, maximum] = price
    return `${formatCurrency(minimum, options)} - ${formatCurrency(maximum, options)}`
  }

  const rangeMatch = price.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)\s*$/
  )

  if (!rangeMatch) return price

  const [, minimum, maximum] = rangeMatch
  return `${formatCurrency(Number(minimum), options)} - ${formatCurrency(Number(maximum), options)}`
}

function Price({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-2", className)}
      {...props}
    />
  )
}

function PriceUnit({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("text-sm leading-tight text-muted-foreground", className)}
      {...props}
    />
  )
}

function PriceValue({
  className,
  price,
  compareAt,
  currency = "USD",
  locale = "en-US",
  variant = "default",
  discountFormat = "percentage",
  showDiscount = true,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof priceValueVariants> & {
    price?: PriceValueType
    compareAt?: PriceValueType
    currency?: string
    locale?: string
    discountFormat?: DiscountFormat
    showDiscount?: boolean
  }) {
  const formattedPrice = formatPriceValue(price, { currency, locale })
  const formattedCompareAt = formatPriceValue(compareAt, { currency, locale })
  const formattedDiscount =
    showDiscount && compareAt
      ? formatPriceDiscount(price, compareAt, {
          currency,
          locale,
          format: discountFormat,
        })
      : null
  const hasDiscount = Boolean(formattedCompareAt && formattedDiscount)

  if (!formattedPrice) return null

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 gap-y-1",
        className
      )}
      {...props}
    >
      <span className={cn(priceValueVariants({ variant }))}>
        {formattedPrice}
      </span>
      {formattedCompareAt ? (
        <span className="text-sm leading-tight text-muted-foreground line-through">
          {formattedCompareAt}
        </span>
      ) : null}
      {hasDiscount ? (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Save {formattedDiscount}
        </span>
      ) : null}
    </span>
  )
}

export {
  Price,
  PriceUnit,
  PriceValue,
  formatPriceDiscount,
  formatPriceValue,
  parseSinglePriceValue,
  priceValueVariants,
}
