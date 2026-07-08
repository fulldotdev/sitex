import type { JsonValue } from "./runtime.ts"

const pageTypes = ["webpage", "article", "faq"] as const

const reservedKeys = ["path", "url", "locale", "children", "headings"] as const

/**
 * Validates MDX frontmatter against the Sitex page schema.
 * Unknown extra keys are allowed and flow through to the layout and pages API.
 */
export function validatePageFrontmatter(
  data: { [key: string]: JsonValue },
  file: string
) {
  for (const key of reservedKeys) {
    if (Object.hasOwn(data, key)) {
      throw new Error(
        `Frontmatter in "${file}" cannot define reserved key "${key}".`
      )
    }
  }

  requireString(data, "layout", file)
  validateLayoutName(data.layout as string, file)
  requireString(data, "title", file)
  requireString(data, "description", file)

  const type = readPageType(data, file)

  optionalAssetPath(data, "image", file)
  optionalCanonical(data, file)
  optionalBoolean(data, "noindex", file)
  optionalString(data, "author", file)
  optionalDate(data, "publishedAt", file)
  optionalDate(data, "updatedAt", file)

  if (type === "article" && data.publishedAt === undefined) {
    throw new Error(
      `Article page "${file}" must define "publishedAt" in frontmatter (YYYY-MM-DD).`
    )
  }

  if (type === "faq") {
    validateQuestions(data.questions, file)
  } else if (data.questions !== undefined) {
    throw new Error(
      `Frontmatter key "questions" in "${file}" is only allowed on pages with "type: faq".`
    )
  }
}

function validateLayoutName(layout: string, file: string) {
  if (
    layout.startsWith(".") ||
    layout.startsWith("/") ||
    layout.includes("..") ||
    !/^[A-Za-z0-9][A-Za-z0-9_/-]*$/.test(layout)
  ) {
    throw new Error(
      `MDX page "${file}" has unsupported layout "${layout}". Use a name like "blog/post", not a relative path.`
    )
  }
}

function readPageType(data: { [key: string]: JsonValue }, file: string) {
  const type = data.type

  if (type === undefined) return "webpage"

  if (
    typeof type !== "string" ||
    !pageTypes.includes(type as (typeof pageTypes)[number])
  ) {
    throw new Error(
      `Frontmatter "type" in "${file}" must be one of ${pageTypes
        .map((name) => `"${name}"`)
        .join(", ")}.`
    )
  }

  return type as (typeof pageTypes)[number]
}

function requireString(
  data: { [key: string]: JsonValue },
  key: string,
  file: string
) {
  const value = data[key]

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `Frontmatter in "${file}" must define a non-empty string "${key}".`
    )
  }
}

function optionalString(
  data: { [key: string]: JsonValue },
  key: string,
  file: string
) {
  if (data[key] === undefined) return

  requireString(data, key, file)
}

function optionalBoolean(
  data: { [key: string]: JsonValue },
  key: string,
  file: string
) {
  const value = data[key]

  if (value !== undefined && typeof value !== "boolean") {
    throw new Error(`Frontmatter "${key}" in "${file}" must be true or false.`)
  }
}

function optionalAssetPath(
  data: { [key: string]: JsonValue },
  key: string,
  file: string
) {
  const value = data[key]

  if (value === undefined) return

  if (
    typeof value !== "string" ||
    (!value.startsWith("/") &&
      !value.startsWith("https://") &&
      !value.startsWith("http://"))
  ) {
    throw new Error(
      `Frontmatter "${key}" in "${file}" must be a public path like "/cover.png" or an absolute URL.`
    )
  }
}

function optionalCanonical(data: { [key: string]: JsonValue }, file: string) {
  const value = data.canonical

  if (value === undefined) return

  if (
    typeof value !== "string" ||
    (!value.startsWith("https://") && !value.startsWith("http://"))
  ) {
    throw new Error(
      `Frontmatter "canonical" in "${file}" must be an absolute URL.`
    )
  }
}

function optionalDate(
  data: { [key: string]: JsonValue },
  key: string,
  file: string
) {
  const value = data[key]

  if (value === undefined) return

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(
      `Frontmatter "${key}" in "${file}" must be a date string like "2026-07-06".`
    )
  }

  const parsed = new Date(`${value}T00:00:00Z`)

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Frontmatter "${key}" in "${file}" is not a valid date.`)
  }
}

function validateQuestions(value: JsonValue | undefined, file: string) {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some(
      (entry) =>
        !entry ||
        typeof entry !== "object" ||
        Array.isArray(entry) ||
        typeof entry.question !== "string" ||
        entry.question.trim() === "" ||
        typeof entry.answer !== "string" ||
        entry.answer.trim() === ""
    )
  ) {
    throw new Error(
      `FAQ page "${file}" must define "questions" as a list of { question, answer } strings.`
    )
  }
}
