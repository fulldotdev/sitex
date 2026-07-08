import { defineConfig } from "vite-plus"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"

import { sitex } from "../../packages/sitex/src/vite/plugin"

export default defineConfig({
  plugins: [
    react(),
    sitex({
      site: {
        url: "https://sitex.full.dev",
      },
      mdx: {
        components: {
          pre: "@/components/mdx-components/pre",
        },
      },
    }),
    tailwindcss(),
  ],
})
