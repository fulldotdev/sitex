import { createHighlighterCore } from "@shikijs/core"
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript"
import bash from "@shikijs/langs/bash"
import html from "@shikijs/langs/html"
import json from "@shikijs/langs/json"
import markdown from "@shikijs/langs/markdown"
import mdx from "@shikijs/langs/mdx"
import ts from "@shikijs/langs/ts"
import tsx from "@shikijs/langs/tsx"
import githubDark from "@shikijs/themes/github-dark"
import githubLight from "@shikijs/themes/github-light"

import { CodeBlockCopyButton } from "@/components/ui/code-block-copy-button"

type CodeBlockHighlighter = Awaited<ReturnType<typeof createHighlighterCore>>

const highlighterStore = globalThis as typeof globalThis & {
  __sitexDocsHighlighter?: Promise<CodeBlockHighlighter>
}

const highlighter = await (highlighterStore.__sitexDocsHighlighter ??=
  createHighlighterCore({
    langs: [bash, html, json, markdown, mdx, ts, tsx],
    themes: [githubLight, githubDark],
    engine: createJavaScriptRegexEngine(),
  }))

type CodeBlockProps = {
  code: string
  lang: "bash" | "html" | "json" | "markdown" | "mdx" | "text" | "ts" | "tsx"
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function codeToPlainHtml(code: string) {
  return `<pre><code>${escapeHtml(code)}</code></pre>`
}

function CodeBlock({ code, lang }: CodeBlockProps) {
  const trimmedCode = code.trim()
  const html =
    lang === "text"
      ? codeToPlainHtml(trimmedCode)
      : highlighter.codeToHtml(trimmedCode, {
          lang,
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
        })

  return (
    <figure className="docs-code-block">
      <CodeBlockCopyButton code={trimmedCode} client:load />
      <div
        className="docs-code-block-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </figure>
  )
}

export { CodeBlock }
