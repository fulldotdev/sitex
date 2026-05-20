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
        appClient: "framework/app-client.tsx",
        pageClient: "framework/page-client.tsx",
        shellClient: "framework/shell-client.tsx",
        styles: "framework/styles.css",
      },
    },
  },
})

const manifest = JSON.parse(
  await readFile("dist/assets/.vite/manifest.json", "utf8")
)

const assets = {
  appScripts: [manifest["framework/app-client.tsx"].file].map(
    (file) => `/assets/${file}`
  ),
  pageScripts: [manifest["framework/page-client.tsx"].file].map(
    (file) => `/assets/${file}`
  ),
  shellScripts: [manifest["framework/shell-client.tsx"].file].map(
    (file) => `/assets/${file}`
  ),
  styles: [
    ...new Set([
      ...(manifest["framework/styles.css"]?.file
        ? [manifest["framework/styles.css"].file]
        : []),
      ...(manifest["framework/app-client.tsx"]?.css ?? []),
      ...(manifest["framework/page-client.tsx"]?.css ?? []),
      ...(manifest["framework/shell-client.tsx"]?.css ?? []),
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
  const { readPage } = await server.ssrLoadModule("/framework/content.ts")
  const { getPageOptions } = await server.ssrLoadModule(
    "/framework/page-options.ts"
  )
  const routes = await getRoutes()

  for (const route of routes) {
    const page = await readPage(route.file)
    const options = getPageOptions(page.data.type)

    if (options.output === "server") {
      console.warn(
        `Skipping ${route.path}: page type "${page.data.type}" uses output: "server".`
      )
      continue
    }

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
