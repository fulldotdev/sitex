import type { MarkdownLayoutProps } from "@fulldotdev/sitex"

type MdxTestLayoutProps = MarkdownLayoutProps<{
  title: string
}>

export default function MdxTestLayout({ title, children }: MdxTestLayoutProps) {
  return (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  )
}
