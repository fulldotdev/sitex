import { useState } from "react"

type Props = {
  closedLabel: string
  openLabel: string
  title: string
}

export function TogglePanel({ closedLabel, openLabel, title }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <section className="rounded-lg border border-teal-500/40 bg-teal-950/20 p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-teal-300">
        client:load
      </p>
      <h2 className="mt-3 text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-300">
        This HTML is present in the initial response, then React hydrates it and
        attaches the click behavior.
      </p>
      <button
        className="mt-5 h-10 rounded-md bg-teal-400 px-4 text-sm font-medium text-zinc-950"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? openLabel : closedLabel}
      </button>
    </section>
  )
}
