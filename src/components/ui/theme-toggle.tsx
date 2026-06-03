import type React from "react"
import { MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

type ThemeToggleProps = React.ComponentProps<typeof Button>

export function ThemeToggle({
  className = "relative",
  variant = "outline",
  size = "icon-sm",
  ...props
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const nextTheme = theme === "dark" ? "light" : "dark"

  return (
    <Button
      data-theme-toggle
      aria-label="Toggle theme"
      onClick={() => setTheme(nextTheme)}
      size={size}
      type="button"
      variant={variant}
      className={className}
      {...props}
    >
      <SunIcon className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <MoonIcon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
