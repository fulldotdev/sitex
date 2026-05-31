import { defineConfig } from "vite"
import { sitex } from "@fulldotdev/sitex/plugin"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  appType: "custom",
  plugins: [react(), sitex(), tailwindcss()],
})
