import { defineConfig } from "vite-plus"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"

import { sitex } from "../../packages/sitex/sitex/vite/plugin"

export default defineConfig({
  appType: "custom",
  plugins: [react(), sitex(), tailwindcss()],
})
