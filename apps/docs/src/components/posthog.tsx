import { useEffect } from "react"

let started = false

export function Posthog() {
  useEffect(() => {
    if (started || window.location.hostname !== "sitex.full.dev") return
    started = true
    void import("@/lib/analytics").then(({ startAnalytics }) =>
      startAnalytics()
    )
  }, [])
  return null
}
