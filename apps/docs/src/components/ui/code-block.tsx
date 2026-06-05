import { createHighlighterCore } from "@shikijs/core"
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript"
import bash from "@shikijs/langs/bash"
import json from "@shikijs/langs/json"
import ts from "@shikijs/langs/ts"
import tsx from "@shikijs/langs/tsx"
import githubDark from "@shikijs/themes/github-dark"
import githubLight from "@shikijs/themes/github-light"

import { CodeBlockCopyButton } from "@/components/ui/code-block-copy-button"

const highlighter = await createHighlighterCore({
  langs: [bash, json, ts, tsx],
  themes: [githubLight, githubDark],
  engine: createJavaScriptRegexEngine(),
})

type CodeBlockProps = {
  code: string
  lang: "bash" | "json" | "text" | "ts" | "tsx"
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
