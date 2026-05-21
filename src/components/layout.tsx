import type { ReactNode } from "react"

import type { GlobalData } from "../schemas/global"

type Props = {
  global: GlobalData
  children: ReactNode
}

export function Layout({ global, children }: Props) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <nav className="mx-auto grid max-w-5xl gap-4 px-6 py-4 md:flex md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-3">
            <a className="font-semibold" href="/">
              {global.siteName}
            </a>
            <span className="text-sm text-zinc-400 md:hidden">Menu</span>
          </div>
          <div className="grid gap-3 text-sm text-zinc-300 md:flex md:gap-4">
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
