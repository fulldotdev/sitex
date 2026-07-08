import { useState } from "react"

import { CheckIcon, CopyIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type CodeCopyButtonProps = {
  code: string
  className?: string
}

function CodeCopyButton({ code, className }: CodeCopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = code
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      textarea.remove()
    }

    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <button
      aria-label={copied ? "Copied" : "Copy code"}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md bg-background/70 text-muted-foreground shadow-xs backdrop-blur transition-colors hover:text-foreground [&_svg]:size-4",
        className
      )}
      onClick={copyCode}
      type="button"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  )
}

export { CodeCopyButton }
