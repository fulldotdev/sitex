import type { ComponentProps } from "react"

import { Features1 } from "@/components/blocks/features-1"
import { Hero1 } from "@/components/blocks/hero-1"
import Base from "@/components/layouts/base"

type Props = ComponentProps<typeof Base> & {
  hero: ComponentProps<typeof Hero1>
  features: ComponentProps<typeof Features1>
}

export default function Home({ hero, features, ...props }: Props) {
  return (
    <Base {...props}>
      <Hero1 {...hero} />
      <Features1 {...features} />
    </Base>
  )
}
