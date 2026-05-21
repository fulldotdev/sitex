import { useEffect, useState } from "react"

type Props = {
  label: string
}

export function BrowserClock({ label }: Props) {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString())

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTime(new Date().toLocaleTimeString())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <section className="rounded-lg border border-fuchsia-500/40 bg-fuchsia-950/20 p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-fuchsia-300">
        client:only
      </p>
      <h2 className="mt-3 text-xl font-semibold">{label}</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-300">
        This block is empty in the server HTML and only appears after the client
        bundle runs.
      </p>
      <p className="mt-5 text-2xl font-semibold tabular-nums">{time}</p>
    </section>
  )
}
