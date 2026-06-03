import { createHighlighterCore } from "shiki/core"
import bash from "shiki/dist/langs/bash.mjs"
import json from "shiki/dist/langs/json.mjs"
import ts from "shiki/dist/langs/ts.mjs"
import tsx from "shiki/dist/langs/tsx.mjs"
import githubDark from "shiki/dist/themes/github-dark.mjs"
import githubLight from "shiki/dist/themes/github-light.mjs"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"

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
    <div
      className="docs-code-block"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export { CodeBlock }
