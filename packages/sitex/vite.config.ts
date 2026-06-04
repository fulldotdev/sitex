import { defineConfig } from "vite-plus"

export default defineConfig({
  pack: {
    entry: {
      "vite/plugin": "src/vite/plugin.ts",
      "hydration/client": "src/hydration/client.tsx",
      "hydration/server": "src/hydration/server.tsx",
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
        "quicktype-core",
        "react",
        "react-dom",
        "vite",
        "vite-plus",
      ],
    },
  },
})
