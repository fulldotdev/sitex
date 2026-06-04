import { defineConfig } from "vite-plus"

export default defineConfig({
  pack: {
    entry: {
      "vite/plugin": "sitex/vite/plugin.ts",
      "hydration/client": "sitex/hydration/client.tsx",
      "hydration/server": "sitex/hydration/server.tsx",
      "router/index": "sitex/router/index.tsx",
      "router/routes": "sitex/router/routes.ts",
    },
    outDir: "package-dist",
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
