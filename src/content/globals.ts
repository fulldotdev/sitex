import type { GlobalData } from "../schemas/global"

export const globals = {
  en: {
    locale: "en",
    siteName: "Ostra",
    nav: [
      { label: "Home", href: "/" },
      { label: "Contact", href: "/contact" },
      { label: "Examples", href: "/examples" },
    ],
  },
  nl: {
    locale: "nl",
    siteName: "Ostra",
    nav: [
      { label: "Home", href: "/nl" },
      { label: "Contact", href: "/nl/contact" },
      { label: "Examples", href: "/examples" },
    ],
  },
} satisfies Record<string, GlobalData>
