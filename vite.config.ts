import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"

import { sitex } from "./sitex/vite/plugin"

export default defineConfig({
  appType: "custom",
  plugins: [react(), sitex(), tailwindcss()],
})
