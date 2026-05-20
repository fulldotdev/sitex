import fg from "fast-glob"

export type Route = {
  file: string
  path: string
  locale: string
}

export async function getRoutes(): Promise<Route[]> {
  const files = await fg("src/content/pages/**/*.md", {
    onlyFiles: true,
  })

  return files.map((file) => ({
    file,
    path: contentFileToPath(file),
    locale: getLocale(file),
  }))
}

export function findRoute(routes: Route[], url: string) {
  const normalizedUrl = normalizePath(url)
  return routes.find((route) => normalizePath(route.path) === normalizedUrl)
}

function contentFileToPath(file: string) {
  const route = file
    .replace(/^src\/content\/pages/, "")
    .replace(/\/index\.md$/, "/")
    .replace(/\.md$/, "/")

  return route || "/"
}

function getLocale(file: string) {
  const relativePath = file.replace(/^src\/content\/pages\//, "")
  const [firstSegment] = relativePath.split("/")

  return firstSegment === "nl" ? "nl" : "en"
}

function normalizePath(path: string) {
  if (path === "/") return path
  return path.replace(/\/$/, "")
}
