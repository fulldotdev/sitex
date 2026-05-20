type Props = {
  title: string
  description: string
}

export function HeroBlock({ title, description }: Props) {
  return (
    <section className="border-b border-zinc-800">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h1 className="max-w-3xl text-5xl font-semibold tracking-normal">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
          {description}
        </p>
      </div>
    </section>
  )
}
