import type { ShellProps } from "ostra/layout"
import { useState } from "react"

export default function ShellLayout({ global, children }: ShellProps) {
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [headerCount, setHeaderCount] = useState(0)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <nav className="mx-auto grid max-w-5xl gap-4 px-6 py-4 md:flex md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-3">
            <a className="font-semibold" href="/">
              {global.siteName}
            </a>
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-100"
                onClick={() => setHeaderCount((count) => count + 1)}
                type="button"
              >
                Shell clicks: {headerCount}
              </button>
              <button
                aria-expanded={navigationOpen}
                aria-label="Toggle navigation"
                className="rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-100 md:hidden"
                onClick={() => setNavigationOpen((open) => !open)}
                type="button"
              >
                Menu
              </button>
            </div>
          </div>
          <div
            className={
              navigationOpen
                ? "grid gap-3 text-sm text-zinc-300 md:flex md:gap-4"
                : "hidden gap-4 text-sm text-zinc-300 md:flex"
            }
          >
            {global.nav.map((item) => (
              <a className="hover:text-white" href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </header>
      {children}
      <footer className="border-t border-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-zinc-400">
          {global.siteName}
        </div>
      </footer>
    </div>
  )
}
