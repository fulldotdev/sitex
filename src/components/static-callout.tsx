type Props = {
  body: string
  title: string
}

export function StaticCallout({ body, title }: Props) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Static
      </p>
      <h2 className="mt-3 text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-300">{body}</p>
      <p className="mt-5 text-xs text-zinc-500">
        Rendered into HTML. No island marker, no client component import.
      </p>
    </section>
  )
}
