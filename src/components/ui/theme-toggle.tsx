import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { MoonIcon, SunIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

function disableTransitionsTemporarily() {
  const style = document.createElement("style")

  style.appendChild(
    document.createTextNode(
      "*, *::before, *::after { transition: none !important; }"
    )
  )

  document.head.appendChild(style)

  return () => {
    void document.documentElement.offsetHeight

    requestAnimationFrame(() => {
      style.remove()
    })
  }
}

function resolveTheme(theme: Theme) {
  if (theme !== "system") return theme

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function applyTheme(theme: Theme, disableTransitions = false) {
  const restoreTransitions = disableTransitions
    ? disableTransitionsTemporarily()
    : null

  document.documentElement.classList[
    resolveTheme(theme) === "dark" ? "add" : "remove"
  ]("dark")

  restoreTransitions?.()
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  if (!children) return null

  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === "undefined"
      ? defaultTheme
      : (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, theme)
        applyTheme(theme, true)
      }

      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}

type ThemeToggleProps = React.ComponentProps<typeof Button>

export function ThemeToggle({
  className,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <Button
      data-theme-toggle
      aria-label="Toggle theme"
      aria-pressed={isDark}
      data-state={isDark ? "on" : "off"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      variant={variant}
      size={size}
      className={cn("relative", className)}
      {...props}
    >
      <SunIcon className="dark:hidden" />
      <MoonIcon className="hidden dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
