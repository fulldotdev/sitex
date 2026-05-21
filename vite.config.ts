import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

import { ostra } from "./framework/plugin"

export default defineConfig({
  appType: "custom",
  plugins: [ostra(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
    },
    dedupe: ["react", "react-dom"],
  },
})
