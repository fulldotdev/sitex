import type { LayoutProps } from "@fulldotdev/sitex"
import type { WebSite, WithContext } from "schema-dts"

import { Features1 } from "@/components/blocks/features-1"
import { Hero1 } from "@/components/blocks/hero-1"
import BaseLayout from "@/layouts/base"

type HomeData = {
  hero: {
    title: string
    description: string
    buttons?: readonly { href: string; label: string }[]
  }
  features: readonly { title: string; description: string }[]
}

export default function HomeLayout({
  title,
  description,
  hero,
  features,
  children,
  path,
  url,
  locale,
  headings,
  image,
  jsonLd,
  publishedAt,
  type,
  updatedAt,
}: LayoutProps<HomeData>) {
  const website: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: title,
    description,
    url,
    publisher: {
      "@type": "Organization",
      name: "Fulldev",
      url: "https://full.dev",
    },
  }

  return (
    <BaseLayout
      title={title}
      description={description}
      headings={headings}
      image={image}
      jsonLd={jsonLd ?? website}
      locale={locale}
      path={path}
      publishedAt={publishedAt}
      type={type}
      updatedAt={updatedAt}
      url={url}
    >
      <Hero1
        title={hero.title}
        description={hero.description}
        buttons={hero.buttons ? [...hero.buttons] : undefined}
      />
      <Features1 features={[...features]} />
      {children}
    </BaseLayout>
  )
}
