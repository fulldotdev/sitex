import type { ThemeOptions } from "@/components/ui/theme-toggle"

/** Shared by the head script and the toggle island so both agree. */
export const theme = {
  defaultTheme: "dark",
  storageKey: "theme",
} satisfies ThemeOptions
