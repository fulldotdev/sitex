import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Section, SectionContainer } from "@/components/ui/section"

type HeroButton = {
  href: string
  label: string
}

type Props = {
  title: ReactNode
  description: ReactNode
  buttons?: HeroButton[]
}

function Hero1({ title, description, buttons = [] }: Props) {
  return (
    <Section className="py-12 sm:py-16">
      <SectionContainer className="max-w-4xl gap-10">
        <div className="flex max-w-3xl flex-col gap-5">
          <h1 className="text-foreground text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
            {title}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-base leading-7 text-balance">
            {description}
          </p>
        </div>

        {buttons.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {buttons.map((button) => (
              <Button
                key={button.href}
                nativeButton={false}
                size="sm"
                render={<a href={button.href} />}
              >
                {button.label}
              </Button>
            ))}
          </div>
        ) : null}
      </SectionContainer>
    </Section>
  )
}

export { Hero1 }
