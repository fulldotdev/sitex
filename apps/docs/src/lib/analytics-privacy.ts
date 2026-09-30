import type { CaptureResult } from "posthog-js"

/** Remove URL credentials, queries and fragments from exception data. */
export function sanitizeExceptionUrls(event: CaptureResult | null) {
  if (event?.event !== "$exception") return event
  // Keep structured line/column fields; remove entire URL queries, including numeric suffixes.
  const seen = new WeakSet()
  const clean = (value: unknown): unknown => {
    if (typeof value === "string") {
      return value.replace(
        /(?:https?:[\\/]{2}|\/)(?:(?!https?:[\\/]{2})[^\s<>"])+/gi,
        (url) => {
          try {
            const parsed = new URL(
              url.replace(/\\/g, "/"),
              "https://redacted.invalid"
            )
            const prefix = /^https?:/i.test(url)
              ? parsed.protocol + "//" + parsed.host
              : url.startsWith("//")
                ? "//" + parsed.host
                : ""
            return prefix + parsed.pathname
          } catch {
            return "[redacted-url]"
          }
        }
      )
    }
    if (value && typeof value === "object" && !seen.has(value)) {
      seen.add(value)
      const record = value as Record<string, unknown>
      for (const key of Object.keys(record)) record[key] = clean(record[key])
    }
    return value
  }
  clean(event.properties)
  return event
}
