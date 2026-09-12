import type { RenderConfig } from "../render/render.tsx"
import {
  resolveSiteConfig,
  type ResolvedSiteConfig,
  type SiteConfig,
} from "../site/config.ts"

export type SitexOptions = {
  site?: SiteConfig
  prefetch?: boolean
  favicon?:
    | false
    | {
        background?: string
        color?: string
        text?: string
      }
  mdx?: {
    components?: Record<string, string>
  }
  trailingSlash?: boolean
}

export type ResolvedSitexOptions = {
  favicon:
    | false
    | {
        background: string
        color: string
        text?: string
      }
  site: ResolvedSiteConfig
  locales: string[]
  prefetch: boolean
  mdx: {
    components: Record<string, string>
  }
  trailingSlash: boolean
}

export function resolveSitexOptions(
  options: SitexOptions
): ResolvedSitexOptions {
  return {
    favicon: resolveFaviconOptions(options.favicon),
    site: resolveSiteConfig(options.site),
    locales: [],
    prefetch: options.prefetch !== false,
    mdx: {
      components: validateMdxComponentImports(options.mdx?.components),
    },
    trailingSlash: options.trailingSlash ?? false,
  }
}

function validateMdxComponentImports(
  components: Record<string, string> | undefined
) {
  if (!components) return {}

  const validated: Record<string, string> = {}

  for (const [name, moduleId] of Object.entries(components)) {
    if (
      !/^[A-Za-z][A-Za-z0-9-]*$/.test(name) ||
      name === "constructor" ||
      name === "prototype" ||
      name === "__proto__"
    ) {
      throw new Error(
        `Invalid MDX component name "${name}". Use a tag name like "pre" or "h2".`
      )
    }

    if (typeof moduleId !== "string" || moduleId.trim() === "") {
      throw new Error(
        `MDX component "${name}" must point to a non-empty import path.`
      )
    }

    validated[name] = moduleId
  }

  return validated
}

function resolveFaviconOptions(options: SitexOptions["favicon"]) {
  if (options === false) return false

  if (options !== undefined && (!options || typeof options !== "object")) {
    throw new Error(`Sitex favicon config must be an object or false.`)
  }

  return {
    background: options?.background ?? "#111827",
    color: options?.color ?? "#ffffff",
    text: options?.text,
  }
}

export function createRenderConfig(
  options: ResolvedSitexOptions
): RenderConfig {
  return {
    defaultLocale: options.site.locale,
    faviconHref: options.favicon === false ? undefined : "/favicon.svg",
    locales: options.locales,
    prefetch: options.prefetch,
    siteUrl: options.site.url,
    trailingSlash: options.trailingSlash,
  }
}
