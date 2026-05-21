import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

import { build, createServer } from "vite"

await rm("dist", { recursive: true, force: true })

await build({
  configFile: "vite.config.ts",
  build: {
    manifest: true,
    outDir: "dist/assets",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        islandClient: "framework/island-client.tsx",
        styles: "framework/styles.css",
      },
    },
  },
})

const manifest = JSON.parse(
  await readFile("dist/assets/.vite/manifest.json", "utf8")
)

const assets = {
  scripts: [
    ...new Set([
      ...(manifest["framework/island-client.tsx"]?.file
        ? [manifest["framework/island-client.tsx"].file]
        : []),
    ]),
  ].map((file) => `/assets/${file}`),
  styles: [
    ...new Set([
      ...(manifest["framework/styles.css"]?.file
        ? [manifest["framework/styles.css"].file]
        : []),
    ]),
  ].map((file) => `/assets/${file}`),
}

const server = await createServer({
  configFile: "vite.config.ts",
  server: { middlewareMode: true },
  appType: "custom",
  mode: "production",
})

try {
  const { getRoutes } = await server.ssrLoadModule("/framework/routes.ts")
  const { renderRoute } = await server.ssrLoadModule("/framework/render.tsx")
  const routes = await getRoutes((id) => server.ssrLoadModule(id))

  for (const route of routes) {
    const html = await renderRoute(route, { assets })
    await writeHtml(route.path, html)
  }
} finally {
  await server.close()
}

async function writeHtml(routePath, html) {
  const file =
    routePath === "/" ? "dist/index.html" : join("dist", routePath, "index.html")

  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, html)
}
