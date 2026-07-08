import type { ComponentProps, ReactElement, ReactNode } from "react"

import { createHighlighterCore } from "@shikijs/core"
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript"
import bash from "@shikijs/langs/bash"
import css from "@shikijs/langs/css"
import html from "@shikijs/langs/html"
import json from "@shikijs/langs/json"
import markdown from "@shikijs/langs/markdown"
import mdx from "@shikijs/langs/mdx"
import ts from "@shikijs/langs/ts"
import tsx from "@shikijs/langs/tsx"
import yaml from "@shikijs/langs/yaml"
import githubDark from "@shikijs/themes/github-dark"
import githubLight from "@shikijs/themes/github-light"

import { CodeCopyButton } from "@/components/ui/code-copy-button"
import { cn } from "@/lib/utils"

type CodeHighlighter = Awaited<ReturnType<typeof createHighlighterCore>>

const highlighterStore = globalThis as typeof globalThis & {
  __uiCodeHighlighter?: Promise<CodeHighlighter>
}

const highlighter = await (highlighterStore.__uiCodeHighlighter ??=
  createHighlighterCore({
    langs: [bash, css, html, json, markdown, mdx, ts, tsx, yaml],
    themes: [githubLight, githubDark],
    engine: createJavaScriptRegexEngine(),
  }))

type CodeLanguage =
  | "bash"
  | "css"
  | "html"
  | "json"
  | "markdown"
  | "mdx"
  | "text"
  | "ts"
  | "tsx"
  | "yaml"

const codeLanguages = new Set<CodeLanguage>([
  "bash",
  "css",
  "html",
  "json",
  "markdown",
  "mdx",
  "text",
  "ts",
  "tsx",
  "yaml",
])

type CodeProps = {
  code: string
  lang?: CodeLanguage
  className?: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function Code({ code, lang = "text", className }: CodeProps) {
  const trimmedCode = code.trim()
  const codeHtml =
    lang === "text"
      ? `<pre><code>${escapeHtml(trimmedCode)}</code></pre>`
      : highlighter.codeToHtml(trimmedCode, {
          lang,
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
        })

  return (
    <figure
      data-slot="code"
      className={cn(
        "relative overflow-hidden rounded-md border border-border bg-muted/40 shadow-xs",
        className
      )}
    >
      <CodeCopyButton
        className="absolute top-2 right-2 z-10"
        code={trimmedCode}
        client:load
      />
      <div
        className={cn(
          "overflow-x-auto text-sm",
          "[&_pre]:m-0 [&_pre]:min-w-max [&_pre]:bg-transparent! [&_pre]:p-4 [&_pre]:pr-14 [&_pre]:font-mono",
          "dark:[&_.shiki]:text-(--shiki-dark)! dark:[&_.shiki_span]:text-(--shiki-dark)!"
        )}
        dangerouslySetInnerHTML={{ __html: codeHtml }}
      />
    </figure>
  )
}

function isReactElement(value: ReactNode): value is ReactElement<{
  className?: string
  children?: ReactNode
}> {
  return typeof value === "object" && value !== null && "props" in value
}

function readLanguage(className: string | undefined): CodeLanguage {
  const language = className?.match(/\blanguage-([A-Za-z0-9_-]+)/)?.[1]

  return language && codeLanguages.has(language as CodeLanguage)
    ? (language as CodeLanguage)
    : "text"
}

function readValue(value: ReactNode) {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : ""
}

/**
 * Drop-in MDX `pre` replacement. Wire it up in vite.config.ts:
 * sitex({ mdx: { components: { pre: "@/components/ui/code" } } })
 */
export default function CodePre({
  children,
}: ComponentProps<"pre">): ReactElement {
  if (!isReactElement(children)) {
    return <pre>{children}</pre>
  }

  return (
    <Code
      code={readValue(children.props.children)}
      lang={readLanguage(children.props.className)}
    />
  )
}

export { Code }
