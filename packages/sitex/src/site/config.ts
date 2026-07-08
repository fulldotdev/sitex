export type SiteConfig = {
  /** Absolute site URL, like "https://example.com". Used for sitemap and robots.txt output. */
  url?: string
  /** Language tag of the root locale, like "en" or "nl". Defaults to "en". */
  locale?: string
}

export type ResolvedSiteConfig = {
  url: string
  locale: string
}

export function resolveSiteConfig(site: SiteConfig | undefined) {
  if (site !== undefined && (!site || typeof site !== "object")) {
    throw new Error(`Sitex site config must be an object when provided.`)
  }

  const url = readSiteUrl(site?.url ?? readDeploymentUrl())

  return {
    url,
    locale: readSiteLocale(site?.locale),
  } satisfies ResolvedSiteConfig
}

function readSiteLocale(value: unknown) {
  if (value === undefined) return "en"

  if (
    typeof value !== "string" ||
    !/^[A-Za-z]{2,3}(-[A-Za-z0-9]+)*$/.test(value)
  ) {
    throw new Error(
      `Sitex site config "site.locale" must be a language tag like "en" or "nl-NL".`
    )
  }

  return value
}

function readRequiredString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Sitex site config "${field}" must be a non-empty string.`)
  }

  return value.trim()
}

function readDeploymentUrl() {
  const env = process.env

  return (
    env.SITE_URL ||
    env.PUBLIC_SITE_URL ||
    env.PUBLIC_URL ||
    env.APP_URL ||
    env.BASE_URL ||
    env.URL ||
    env.VERCEL_PROJECT_PRODUCTION_URL ||
    env.CF_PAGES_URL ||
    env.RENDER_EXTERNAL_URL ||
    env.RENDER_EXTERNAL_HOSTNAME ||
    env.RAILWAY_PUBLIC_DOMAIN ||
    env.KOYEB_PUBLIC_DOMAIN ||
    env.DEPLOY_PRIME_URL ||
    env.DEPLOY_URL ||
    env.VERCEL_BRANCH_URL ||
    env.VERCEL_URL
  )
}

function readSiteUrl(value: unknown) {
  if (value === undefined) {
    throw new Error(
      `Sitex needs a site URL for sitemap and robots output. Pass sitex({ site: { url } }) or set SITE_URL, PUBLIC_SITE_URL, PUBLIC_URL, APP_URL, BASE_URL, URL, VERCEL_PROJECT_PRODUCTION_URL, CF_PAGES_URL, RENDER_EXTERNAL_URL, RENDER_EXTERNAL_HOSTNAME, RAILWAY_PUBLIC_DOMAIN, KOYEB_PUBLIC_DOMAIN, DEPLOY_PRIME_URL, DEPLOY_URL, VERCEL_BRANCH_URL, or VERCEL_URL.`
    )
  }

  const url = normalizeSiteUrl(readRequiredString(value, "site.url"))

  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    throw new Error(
      `Sitex site config "site.url" must be an absolute URL like "https://example.com".`
    )
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Sitex site config "site.url" must use http or https.`)
  }

  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error(
      `Sitex site config "site.url" must be a site origin without a path, like "https://example.com".`
    )
  }

  return parsed.origin
}

function normalizeSiteUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url

  return `https://${url}`
}
