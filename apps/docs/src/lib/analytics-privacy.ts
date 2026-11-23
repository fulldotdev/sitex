import type { CaptureResult } from "posthog-js"

/** Keep basic page statistics and remove URL query strings and fragments. */
export function sanitizeEventUrls(event: CaptureResult | null) {
  if (!event || !["$pageview", "$pageleave"].includes(event.event)) return null
  const seen = new WeakSet()
  function scrub(value: unknown) {
    if (!value || typeof value !== "object" || seen.has(value)) return
    seen.add(value)
    const properties = value as Record<string, unknown>
    for (const [key, nested] of Object.entries(value)) {
      if (typeof nested === "string" && /^https?:\/\//i.test(nested)) {
        try {
          const url = new URL(nested)
          if (/referrer/i.test(key)) url.pathname = "/"
          url.search = ""
          url.hash = ""
          properties[key] = url.href
        } catch {
          properties[key] = ""
        }
      } else scrub(nested)
    }
  }
  for (const values of [event.properties, event.$set, event.$set_once])
    scrub(values)
  return event
}
