import { useEffect } from "react"

let started = false

function startAnalytics() {
  void import("@/lib/analytics").then(({ startAnalytics }) => startAnalytics())
}

// Load analytics once the page has loaded and the browser is idle, so it
// does not compete with the page's own resources.
function scheduleAnalytics() {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(startAnalytics, { timeout: 1000 })
  } else {
    setTimeout(startAnalytics, 0)
  }
}

export function Posthog() {
  useEffect(() => {
    if (started || window.location.hostname !== "sitex.full.dev") return
    started = true
    if (document.readyState === "complete") scheduleAnalytics()
    else window.addEventListener("load", scheduleAnalytics, { once: true })
  }, [])
  return null
}
