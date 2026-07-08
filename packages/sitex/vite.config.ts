import { defineConfig } from "vite-plus"

export default defineConfig({
  pack: {
    entry: {
      index: "src/index.ts",
      "vite/plugin": "src/vite/plugin.ts",
      "hydration/client": "src/hydration/client.tsx",
      "hydration/server": "src/hydration/server.tsx",
      "prefetch/client": "src/prefetch/client.ts",
      "render/render": "src/render/render.tsx",
      "router/runtime": "src/router/runtime.ts",
    },
    outDir: "dist",
    format: "esm",
    fixedExtension: false,
    dts: true,
    clean: true,
    deps: {
      neverBundle: [
        /^node:/,
        /^virtual:/,
        "fast-glob",
        "parse5",
        "react",
        "react-dom",
        "vite",
        "vite-plus",
      ],
    },
  },
})
