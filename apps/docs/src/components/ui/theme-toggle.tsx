import { MoonIcon, SunIcon } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

type Theme = "dark" | "light" | "system"
type ResolvedTheme = "dark" | "light"

type ThemeOptions = {
  /** Theme used before a stored preference exists. Defaults to "system". */
  defaultTheme?: Theme
  /** localStorage key that stores the preference. Defaults to "theme". */
  storageKey?: string
}

type ThemeState = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeState | undefined>(undefined)

function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light" || value === "system"
}

function readStoredTheme(storageKey: string) {
  try {
    const value = localStorage.getItem(storageKey)

    return isTheme(value) ? value : undefined
  } catch {
    return undefined
  }
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme !== "system") return theme

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme)
  const root = document.documentElement

  root.classList.remove("light", "dark")
  root.classList.add(resolved)

  return resolved
}

function disableTransitionsTemporarily() {
  const style = document.createElement("style")
  style.appendChild(
    document.createTextNode("*,*::before,*::after{transition:none!important}")
  )
  document.head.appendChild(style)
  window.getComputedStyle(document.body)

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      style.remove()
    })
  })
}

/**
 * Theme state for one island. The server and the first client render both
 * use `defaultTheme`, so hydration never mismatches; the stored preference is
 * read after mount. Pass `enabled: false` when a ThemeProvider already owns
 * the state.
 */
function useThemeState(
  { defaultTheme = "system", storageKey = "theme" }: ThemeOptions,
  enabled = true
): ThemeState {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(
    defaultTheme === "dark" ? "dark" : "light"
  )

  React.useEffect(() => {
    if (!enabled) return

    const stored = readStoredTheme(storageKey) ?? defaultTheme

    setThemeState(stored)
    setResolvedTheme(applyTheme(stored))
  }, [defaultTheme, enabled, storageKey])

  React.useEffect(() => {
    if (!enabled || theme !== "system") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => setResolvedTheme(applyTheme("system"))

    media.addEventListener("change", onChange)

    return () => media.removeEventListener("change", onChange)
  }, [enabled, theme])

  const setTheme = React.useCallback(
    (next: Theme) => {
      try {
        localStorage.setItem(storageKey, next)
      } catch {
        // Storage can be unavailable; the theme still applies for this visit.
      }

      disableTransitionsTemporarily()
      setThemeState(next)
      setResolvedTheme(applyTheme(next))
    },
    [storageKey]
  )

  return React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )
}

/**
 * Applies the stored or default theme class before first paint so the page
 * does not flash. Render it inside `<head>` with the same options as the
 * toggle or provider.
 */
function ThemeScript({
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeOptions) {
  const script = `(function(){try{var t=localStorage.getItem(${JSON.stringify(storageKey)})||${JSON.stringify(defaultTheme)};var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.add(d?"dark":"light")}catch(e){}})()`

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}

/** Shares one theme state between several controls inside the same island. */
function ThemeProvider({
  children,
  ...options
}: ThemeOptions & { children?: React.ReactNode }) {
  const state = useThemeState(options)

  return <ThemeContext.Provider value={state}>{children}</ThemeContext.Provider>
}

/** Returns the theme state from the nearest ThemeProvider, if any. */
function useTheme() {
  return React.useContext(ThemeContext)
}

/**
 * Sun/moon button that flips between light and dark. Works on its own as an
 * island, or inside a ThemeProvider when other controls share the state.
 */
function ThemeToggle({
  className = "relative",
  defaultTheme,
  storageKey,
  onClick,
  ...props
}: React.ComponentProps<"button"> & ThemeOptions) {
  const context = React.useContext(ThemeContext)
  const standalone = useThemeState(
    { defaultTheme, storageKey },
    context === undefined
  )
  const { resolvedTheme, setTheme } = context ?? standalone

  return (
    <button
      data-theme-toggle
      aria-label="Toggle theme"
      aria-pressed={resolvedTheme === "dark"}
      data-state={resolvedTheme === "dark" ? "on" : "off"}
      type="button"
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-sm font-medium shadow-xs transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
      }}
      {...props}
    >
      <SunIcon className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <MoonIcon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}

export { ThemeProvider, ThemeScript, ThemeToggle, useTheme }
export type { Theme, ThemeOptions }
