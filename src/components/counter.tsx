import { type ReactNode, useState } from "react"

type Props = {
  children?: ReactNode
  description?: string
  initialCount?: number
  label?: string
  title?: string
}

export function Counter({
  children,
  description = "Clicking only works when this component is hydrated.",
  initialCount = 0,
  label = "Count",
  title = "Counter",
}: Props) {
  const [count, setCount] = useState(initialCount)

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm leading-6 text-zinc-300">{description}</p>
      <button
        className="h-10 rounded-md bg-teal-400 px-4 text-sm font-medium text-zinc-950"
        onClick={() => setCount((value) => value + 1)}
        type="button"
      >
        {label}: {count}
      </button>
      {children ? (
        <div className="rounded-md border border-zinc-700 bg-zinc-950/50 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Child slot
          </p>
          {children}
        </div>
      ) : null}
    </div>
  )
}
