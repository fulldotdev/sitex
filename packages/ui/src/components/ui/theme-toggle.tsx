import { MoonIcon, SunIcon } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children?: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext =
  React.createContext<ThemeProviderState>(initialState)

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

function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(() =>
    typeof window === "undefined"
      ? defaultTheme
      : (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  React.useEffect(() => {
    const root = window.document.documentElement

    disableTransitionsTemporarily()
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = React.useMemo(
    () => ({
      theme,
      setTheme: (theme: Theme) => {
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, theme)
        }

        setTheme(theme)
      },
    }),
    [storageKey, theme]
  )

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

function useTheme() {
  return React.useContext(ThemeProviderContext)
}

function ThemeToggle({
  className = "relative",
  ...props
}: React.ComponentProps<"button">) {
  const { theme, setTheme } = useTheme()
  const nextTheme = theme === "dark" ? "light" : "dark"

  return (
    <button
      data-theme-toggle
      aria-label="Toggle theme"
      aria-pressed={theme === "dark"}
      data-state={theme === "dark" ? "on" : "off"}
      type="button"
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-sm font-medium shadow-xs transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={() => setTheme(nextTheme)}
      {...props}
    >
      <SunIcon className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <MoonIcon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}

export { ThemeProvider, ThemeToggle, useTheme }
export type { Theme }
