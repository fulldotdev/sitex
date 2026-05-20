type Props = {
  title: string
  buttonLabel: string
}

export function Newsletter({ title, buttonLabel }: Props) {
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        window.alert("The page body is hydrated.")
      }}
    >
      <h2 className="text-xl font-semibold">{title}</h2>
      <input
        className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm outline-none ring-teal-400 focus:ring-2"
        name="email"
        placeholder="you@example.com"
        type="email"
      />
      <button className="h-10 rounded-md bg-teal-400 px-4 text-sm font-medium text-zinc-950">
        {buttonLabel}
      </button>
    </form>
  )
}
