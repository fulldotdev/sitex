import { useState } from "react"

type Props = {
  initialCount?: number
}

export function Counter({ initialCount = 0 }: Props) {
  const [count, setCount] = useState(initialCount)

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Counter</h2>
      <p className="text-sm leading-6 text-zinc-300">
        This counter is part of the page layout. It only updates when the
        layout is hydrated on the client.
      </p>
      <button
        className="h-10 rounded-md bg-teal-400 px-4 text-sm font-medium text-zinc-950"
        onClick={() => setCount((value) => value + 1)}
      >
        Count: {count}
      </button>
    </div>
  )
}
