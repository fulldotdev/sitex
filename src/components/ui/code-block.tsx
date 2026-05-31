import { createHighlighter } from "shiki"

const highlighter = await createHighlighter({
  langs: ["bash", "json", "text", "ts", "tsx"],
  themes: ["github-light", "github-dark"],
})

type CodeBlockProps = {
  code: string
  lang: "bash" | "json" | "text" | "ts" | "tsx"
}

function CodeBlock({ code, lang }: CodeBlockProps) {
  const html = highlighter.codeToHtml(code.trim(), {
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
