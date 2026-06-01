import { rm } from "node:fs/promises"
import { builtinModules, createRequire } from "node:module"
import { build } from "esbuild"

const require = createRequire(import.meta.url)
const packageJson = require("../package.json")

const external = [
  ...builtinModules,
  ...builtinModules.map((module) => `node:${module}`),
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
  "virtual:*",
]

await rm("package-dist", { recursive: true, force: true })

await build({
  entryPoints: [
    "sitex/vite/plugin.ts",
    "sitex/hydration/client.tsx",
    "sitex/hydration/server.tsx",
    "sitex/router/index.tsx",
    "sitex/router/routes.ts",
  ],
  outbase: "sitex",
  outdir: "package-dist",
  bundle: true,
  external,
  format: "esm",
  jsx: "automatic",
  platform: "neutral",
  target: "es2022",
})
