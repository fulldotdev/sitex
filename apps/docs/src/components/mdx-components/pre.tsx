import type { ComponentProps, ReactElement, ReactNode } from "react"

import { CodeBlock } from "@/components/ui/code-block"

type CodeBlockLanguage = ComponentProps<typeof CodeBlock>["lang"]

const codeBlockLanguages = new Set<CodeBlockLanguage>([
  "bash",
  "html",
  "json",
  "markdown",
  "mdx",
  "text",
  "ts",
  "tsx",
])

function isReactElement(value: ReactNode): value is ReactElement<{
  className?: string
  children?: ReactNode
}> {
  return typeof value === "object" && value !== null && "props" in value
}

function readCodeBlockLanguage(className: string | undefined) {
  const language = className?.match(/\blanguage-([A-Za-z0-9_-]+)/)?.[1]

  return language && codeBlockLanguages.has(language as CodeBlockLanguage)
    ? (language as CodeBlockLanguage)
    : "text"
}

function readCodeBlockValue(value: ReactNode) {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : ""
}

export default function MdxPre({ children }: { children?: ReactNode }) {
  if (!isReactElement(children)) {
    return <pre>{children}</pre>
  }

  return (
    <CodeBlock
      code={readCodeBlockValue(children.props.children)}
      lang={readCodeBlockLanguage(children.props.className)}
    />
  )
}
