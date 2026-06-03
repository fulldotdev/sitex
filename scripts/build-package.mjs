import { rm } from "node:fs/promises"
import { builtinModules, createRequire } from "node:module"
import { rolldown } from "rolldown"

const require = createRequire(import.meta.url)
const packageJson = require("../package.json")

const external = [
  ...builtinModules,
  ...builtinModules.map((module) => `node:${module}`),
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
]
const isExternal = (id) =>
  external.some(
    (dependency) => id === dependency || id.startsWith(`${dependency}/`)
  ) || id.startsWith("virtual:")

await rm("package-dist", { recursive: true, force: true })

const bundle = await rolldown({
  input: {
    "vite/plugin": "sitex/vite/plugin.ts",
    "hydration/client": "sitex/hydration/client.tsx",
    "hydration/server": "sitex/hydration/server.tsx",
    "router/index": "sitex/router/index.tsx",
    "router/routes": "sitex/router/routes.ts",
  },
  external: isExternal,
})

await bundle.write({
  dir: "package-dist",
  entryFileNames: "[name].js",
  format: "esm",
})
