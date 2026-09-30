import type { CaptureResult } from "posthog-js"

/** Remove URL details from exceptions; redact ambiguous text as a whole. */
export function sanitizeExceptionUrls(event: CaptureResult | null) {
  if (event?.event !== "$exception") return event
  const seen = new WeakSet()
  const clean = (value: unknown): unknown => {
    if (typeof value === "string") {
      if (!/[?#@]/.test(value)) return value
      const normalized = value.replace(/\\/g, "/")
      // Only preserve an unambiguous standalone URL or relative filename.
      if (
        /\s|["'<>]/.test(normalized) ||
        !/^(?:https?:|\/|\.\.?\/|[\w.-]+[?#])/i.test(normalized)
      ) {
        return "[redacted-url-details]"
      }
      try {
        const absolute = /^https?:/i.test(normalized)
        const parsed = new URL(
          normalized,
          absolute ? undefined : "https://redacted.invalid"
        )
        if (/https?:|\/\/|@/i.test(parsed.pathname))
          return "[redacted-url-details]"
        const prefix = absolute
          ? parsed.protocol + "//" + parsed.host
          : normalized.startsWith("//")
            ? "//" + parsed.host
            : ""
        const pathname =
          !absolute && !normalized.startsWith("/")
            ? parsed.pathname.slice(1)
            : parsed.pathname
        return prefix + pathname
      } catch {
        return "[redacted-url-details]"
      }
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
