import { defineConfig } from "vite-plus"

export default defineConfig({
  pack: {
    entry: {
      index: "src/index.ts",
      "vite/plugin": "src/vite/plugin.ts",
      "hydration/client": "src/hydration/client.tsx",
      "hydration/server": "src/hydration/server.tsx",
      "nitro/renderer": "src/nitro/renderer.ts",
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
        "@babel/generator",
        "@babel/parser",
        "@babel/traverse",
        "@babel/types",
        "fast-glob",
        "nitro",
        "nitro/vite",
        "quicktype-core",
        "react",
        "react-dom",
        "vite",
        "vite-plus",
      ],
    },
  },
})
