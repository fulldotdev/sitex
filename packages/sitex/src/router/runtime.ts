import type { ReactNode } from "react"

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export type RouteParams = Record<string, string>
export type RouteRenderMode = "static" | "server"

export type StaticPath<Props = JsonValue> = {
  params: RouteParams
  props?: Props
}

export type StaticPaths<Props = JsonValue> =
  | StaticPath<Props>[]
  | (() => StaticPath<Props>[] | Promise<StaticPath<Props>[]>)

export type PageContext<Props = unknown> = {
  params: RouteParams
  props: Props
  request?: Request
  url: URL
}

export type PageLayout<Props = unknown> = (
  context: PageContext<Props>
) => ReactNode | Promise<ReactNode>

export type MarkdownLayoutProps<TData extends object = object> = TData & {
  children: ReactNode
  headings?: readonly MarkdownHeading[]
  path?: string
}

export type MarkdownHeading = {
  depth: number
  href: string
  id: string
  label: string
}

export type Route<Props = unknown> = {
  file: string
  layout: PageLayout<Props>
  paramNames: string[]
  params: RouteParams
  path: string
  props: Props
  render: RouteRenderMode
  score: number
}

type PageModule<Props = JsonValue> = {
  default?: unknown
  paths?: StaticPaths<Props>
  render?: unknown
}

type RouteMatch<Props = unknown> = {
  params: RouteParams
  route: Route<Props>
}

export async function readPageRoutes(
  module: unknown,
  file: string
): Promise<Route<unknown>[]> {
  const pageModule = module as PageModule
  const component = pageModule.default

  if (typeof component !== "function") {
    throw new Error(`Page module "${file}" must default export a component.`)
  }

  if (pageModule.render !== undefined && pageModule.render !== "server") {
    const renderMode = JSON.stringify(pageModule.render)

    throw new Error(
      `Page module "${file}" has unsupported render mode ${renderMode}. Only "server" is supported.`
    )
  }

  const render: RouteRenderMode =
    pageModule.render === "server" ? "server" : "static"
  const pattern = pageFileToRoutePattern(file)
  const paramNames = readParamNames(pattern)

  if (render === "server") {
    return [
      createRoute({
        file,
        layout: component as PageLayout,
        paramNames,
        params: {},
        path: pattern,
        props: undefined as unknown,
        render,
      }),
    ]
  }

  if (paramNames.length === 0) {
    if (pageModule.paths !== undefined) {
      throw new Error(
        `Static page module "${file}" exports paths, but its route has no params.`
      )
    }

    return [
      createRoute({
        file,
        layout: component as PageLayout,
        paramNames,
        params: {},
        path: pattern,
        props: undefined as unknown,
        render,
      }),
    ]
  }

  if (pageModule.paths === undefined) {
    throw new Error(
      `Dynamic static page module "${file}" must export paths or render = "server".`
    )
  }

  const paths =
    typeof pageModule.paths === "function"
      ? await pageModule.paths()
      : pageModule.paths

  if (!Array.isArray(paths)) {
    throw new Error(`Static paths export in "${file}" must return an array.`)
  }

  return paths.map((path, index) => {
    validateStaticPath(file, pattern, paramNames, path, index)

    return createRoute({
      file,
      layout: component as PageLayout,
      paramNames,
      params: path.params,
      path: fillRoutePattern(pattern, path.params),
      props: path.props as unknown,
      render,
    })
  })
}

export function sortRoutes(routes: Route[]) {
  return [...routes].sort(
    (a: Route, b: Route) => b.score - a.score || a.path.localeCompare(b.path)
  )
}

export function matchRoute(
  routes: Route[],
  url: string
): RouteMatch | undefined {
  const normalizedUrl = normalizeRoutePath(url)

  for (const route of sortRoutes(routes)) {
    const params = matchRoutePath(route.path, normalizedUrl)

    if (params) return { params: { ...route.params, ...params }, route }
  }
}

export function createPageContext<Props>(
  route: Route<Props>,
  params: RouteParams,
  request?: Request
): PageContext<Props> {
  const url = request
    ? new URL(request.url)
    : new URL(route.path, "https://sitex.local")

  return {
    params,
    props: route.props,
    request,
    url,
  }
}

export function validateUniqueRoutePaths(routes: Route[]) {
  const seen = new Map<string, string>()

  for (const route of routes) {
    const key = route.path
    const previous = seen.get(key)

    if (previous) {
      throw new Error(
        `Routes "${previous}" and "${route.file}" both resolve to "${route.path}".`
      )
    }

    seen.set(key, route.file)
  }
}

function createRoute<Props>(route: Omit<Route<Props>, "score">): Route<Props> {
  return {
    ...route,
    path: normalizeRoutePath(route.path),
    score: scoreRoute(route.path),
  }
}

function pageFileToRoutePattern(file: string) {
  const route = file
    .replace(/^src\/pages/, "")
    .replace(/\/index\.(tsx|mdx)$/, "/")
    .replace(/\.(tsx|mdx)$/, "")

  return normalizeRoutePath(route || "/")
}

function normalizeRoutePath(path: string) {
  if (!path || path === "/") return "/"
  return `/${path.replace(/^\/+|\/+$/g, "")}`
}

function readParamNames(path: string) {
  return [...path.matchAll(/\[([^\]]+)\]/g)].map((match) => {
    const name = match[1]

    if (!name || name.startsWith("...")) {
      throw new Error(`Unsupported route param "[${name}]" in "${path}".`)
    }

    return name
  })
}

function validateStaticPath(
  file: string,
  pattern: string,
  paramNames: string[],
  path: StaticPath,
  index: number
) {
  if (!path || typeof path !== "object" || Array.isArray(path)) {
    throw new Error(`Static path ${index} in "${file}" must be an object.`)
  }

  validateJsonValue(path.props, `${file} paths[${index}].props`, new WeakSet())

  const params = path.params

  if (!params || typeof params !== "object" || Array.isArray(params)) {
    throw new Error(
      `Static path ${index} in "${file}" must include a params object.`
    )
  }

  const actual = Object.keys(params).sort()
  const expected = [...paramNames].sort()

  if (actual.join("\0") !== expected.join("\0")) {
    throw new Error(
      `Static path ${index} in "${file}" must provide params { ${expected.join(", ")} } for "${pattern}".`
    )
  }

  for (const [key, value] of Object.entries(params)) {
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(
        `Static path ${index} in "${file}" param "${key}" must be a non-empty string.`
      )
    }
  }
}

function fillRoutePattern(pattern: string, params: RouteParams) {
  return pattern.replace(/\[([^\]]+)\]/g, (_match, key: string) =>
    encodeURIComponent(params[key] ?? "")
  )
}

function matchRoutePath(
  pattern: string,
  path: string
): RouteParams | undefined {
  const paramNames = readParamNames(pattern)

  if (paramNames.length === 0) {
    return normalizeRoutePath(pattern) === normalizeRoutePath(path)
      ? {}
      : undefined
  }

  const patternSegments = normalizeRoutePath(pattern).split("/")
  const pathSegments = normalizeRoutePath(path).split("/")

  if (patternSegments.length !== pathSegments.length) return

  const params: RouteParams = {}

  for (let index = 0; index < patternSegments.length; index++) {
    const patternSegment = patternSegments[index]
    const pathSegment = pathSegments[index]
    const paramMatch = patternSegment.match(/^\[([^\]]+)\]$/)

    if (paramMatch) {
      params[paramMatch[1]] = decodeURIComponent(pathSegment)
      continue
    }

    if (patternSegment !== pathSegment) return
  }

  return params
}

function scoreRoute(path: string) {
  return normalizeRoutePath(path)
    .split("/")
    .reduce((score, segment) => {
      if (!segment) return score
      return score + (segment.startsWith("[") ? 1 : 10)
    }, 0)
}

function validateJsonValue(
  value: unknown,
  path: string,
  seen: WeakSet<object>
) {
  if (value === undefined || value === null) return

  const valueType = typeof value

  if (valueType === "string" || valueType === "boolean") return

  if (valueType === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`${path} contains a non-finite number.`)
    }

    return
  }

  if (valueType !== "object") {
    throw new Error(`${path} must be JSON-serializable.`)
  }

  const objectValue = value as Record<string | symbol, unknown>

  if (seen.has(objectValue)) {
    throw new Error(`${path} contains a circular value.`)
  }

  seen.add(objectValue)

  if (Array.isArray(objectValue)) {
    objectValue.forEach((item, index) => {
      validateJsonValue(item, `${path}[${index}]`, seen)
    })
    seen.delete(objectValue)
    return
  }

  const prototype = Object.getPrototypeOf(objectValue)

  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${path} must only contain plain objects and arrays.`)
  }

  for (const key of Reflect.ownKeys(objectValue)) {
    if (typeof key === "symbol") {
      throw new Error(`${path} cannot contain symbol keys.`)
    }

    validateJsonValue(objectValue[key], `${path}.${key}`, seen)
  }

  seen.delete(objectValue)
}
