import type { ReactNode } from "react"

import { Section, SectionContainer } from "@/components/ui/section"

type Feature = {
  title: ReactNode
  description: ReactNode
}

type Props = {
  features: Feature[]
}

function Features1({ features }: Props) {
  return (
    <Section className="pt-0 pb-12 sm:pb-16">
      <SectionContainer className="max-w-4xl">
        <div className="grid gap-6 border-t border-border pt-10 text-sm sm:grid-cols-3">
          {features.map((feature, index) => (
            <div className="flex flex-col gap-2" key={index}>
              <h2 className="font-medium text-foreground">{feature.title}</h2>
              <p className="leading-6 text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </SectionContainer>
    </Section>
  )
}

export { Features1 }
