import Doc from "@/components/layouts/doc"
import { CodeBlock } from "@/components/ui/code-block"

export const data = {
  title: "Pages API",
  description: "Share route metadata with typed getPages and getPage helpers.",
  order: 4,
  tocItems: [
    { href: "#overview", label: "Overview" },
    { href: "#data-export", label: "data export" },
    { href: "#mdx-pages", label: "MDX pages" },
    { href: "#get-pages", label: "getPages" },
    { href: "#get-page", label: "getPage" },
    { href: "#typing", label: "Typing" },
    { href: "#limits", label: "Limits" },
  ],
}

export default function ContentPage() {
  return (
    <Doc
      title={data.title}
      description={data.description}
      path="/docs/content"
      doc={data}
    >
      <h2 id="overview">Overview</h2>
      <p>
        Route files can export a <code>data</code> object next to the page
        component. Sitex reads those exports and exposes flat page data through{" "}
        <code>sitex:pages</code>, so overview pages and layouts can build blog
        indexes, cards, previous and next links, sidebars, and metadata from the
        routes themselves.
      </p>
      <p>
        Paths use the same slash-prefixed shape as browser routes, such as{" "}
        <code>/docs/content</code>.
      </p>

      <h2 id="data-export">data export</h2>
      <p>
        Add <code>export const data</code> to any route that should be
        discoverable. The route keeps owning the full page, while the exported
        object becomes reusable site data.
      </p>
      <CodeBlock
        lang="tsx"
        code={`type PostContent = {
  title: string
  description: string
  publishedAt: string
  author: string
  tags: string[]
}

export const data = {
  title: "Building content sites with React",
  description: "How route-owned content keeps pages local and reusable.",
  publishedAt: "2026-06-03",
  author: "Sil",
  tags: ["react", "content"],
} satisfies PostContent

export default function PostPage() {
  return (
    <article>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
      {/* full post content */}
    </article>
  )
}`}
      />
      <p>
        This is useful for blog posts because the post page can stay as TSX,
        while the blog overview can still list posts without duplicating titles,
        dates, descriptions, or tags.
      </p>

      <h2 id="mdx-pages">MDX pages</h2>
      <p>
        Add <code>.mdx</code> files to <code>src/pages</code> for prose routes.
        MDX pages require YAML frontmatter with a <code>layout</code> value.
        Layout names resolve from <code>src/layouts</code>.
      </p>
      <CodeBlock
        lang="text"
        code={`---
layout: blog/post
title: Building content sites with React
description: How route-owned content keeps pages local and reusable.
---

# Building content sites with React

This body is rendered as React children inside the layout.`}
      />
      <CodeBlock
        lang="tsx"
        code={`// src/layouts/blog/post.tsx
import type { MarkdownLayoutProps } from "@fulldotdev/sitex"

type Props = MarkdownLayoutProps<{
  title: string
  description: string
}>

export default function BlogPostLayout({
  title,
  description,
  children,
}: Props) {
  return (
    <article>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </article>
  )
}`}
      />
      <p>
        The <code>layout</code> field is used to pick the layout and remains
        visible through <code>getPage</code> and <code>getPages</code>. It is
        not passed to the layout component. Page data cannot define{" "}
        <code>path</code> or <code>children</code>.
      </p>

      <h2 id="get-pages">getPages</h2>
      <p>
        Use <code>getPages</code> to read all page data exports, or pass a
        slash-prefixed path prefix to scope the result. A blog overview usually
        reads only <code>/blog</code> pages, sorts them, and maps them to cards.
      </p>
      <CodeBlock
        lang="tsx"
        code={`import { getPages } from "sitex:pages"

const posts = await getPages("/blog")

export default function BlogPage() {
  return (
    <main>
      <h1>Blog</h1>
      <div>
        {posts
          .sort((a, b) => {
            return b.publishedAt.localeCompare(a.publishedAt)
          })
          .map((post) => (
            <article key={post.path}>
              <a href={post.path}>{post.title}</a>
              <p>{post.description}</p>
              <time dateTime={post.publishedAt}>
                {post.publishedAt}
              </time>
            </article>
          ))}
      </div>
    </main>
  )
}`}
      />
      <p>
        <code>getPages("/blog")</code> returns pages whose paths start with{" "}
        <code>/blog</code>. Use <code>page.path</code> directly in links; it
        follows the configured trailing-slash style. The return value is async,
        matching the shape of content APIs like Astro&apos;s{" "}
        <code>getCollection</code>.
      </p>

      <h2 id="get-page">getPage</h2>
      <p>
        Use <code>getPage</code> when you know the exact route path.
      </p>
      <CodeBlock
        lang="tsx"
        code={`import { getPage } from "sitex:pages"

const post = await getPage("/blog/building-content-sites")

export default function FeaturedPost() {
  if (!post) {
    return null
  }

  return (
    <aside>
      <p>Featured post</p>
      <a href={post.path}>{post.title}</a>
      <p>{post.description}</p>
      <time dateTime={post.publishedAt}>
        {post.publishedAt}
      </time>
    </aside>
  )
}`}
      />
      <p>
        The return value is <code>Page | undefined</code>, so missing paths are
        explicit.
      </p>

      <h2 id="typing">Typing</h2>
      <p>
        Sitex generates types for <code>sitex:pages</code> from the actual{" "}
        <code>data</code> exports in <code>src/pages</code>. Editors can then
        infer fields like <code>title</code>, <code>description</code>,{" "}
        <code>publishedAt</code>, and <code>tags</code> when you call{" "}
        <code>getPages</code> or <code>getPage</code>.
      </p>
      <CodeBlock
        lang="ts"
        code={`type Page = {
  path: string
  title: string
  description: string
  publishedAt?: string
  author?: string
  tags?: string[]
}`}
      />
      <p>
        Generated types describe what exists in the project. If you want to
        enforce a consistent shape across all blog posts, give the{" "}
        <code>data</code> export its own type. Prefer <code>satisfies</code>,
        because it checks the object while preserving the inferred values Sitex
        reads.
      </p>
      <CodeBlock
        lang="ts"
        code={`type PostContent = {
  title: string
  description: string
  publishedAt: string
  author: string
  tags: string[]
}

export const data = {
  title: "Building content sites with React",
  description: "How route-owned content keeps pages local and reusable.",
  publishedAt: "2026-06-03",
  author: "Sil",
  tags: ["react", "content"],
} satisfies PostContent`}
      />
      <p>
        This is similar to Astro content collections: generated types make reads
        convenient, and explicit authoring types keep entries consistent.
      </p>

      <h2 id="limits">Limits</h2>
      <p>
        Sitex executes page modules during content discovery and then reads the
        exported <code>data</code> value. That means <code>data</code> can use
        imported values, constants, and helper functions.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { defaultAuthor } from "@/data/authors"

function createTags() {
  return ["react", "content"]
}

export const data = {
  title: "Building content sites with React",
  description: "How route-owned content keeps pages local and reusable.",
  publishedAt: "2026-06-03",
  author: defaultAuthor.name,
  tags: createTags(),
} satisfies PostContent`}
      />
      <p>
        After those imports and helpers have run, the final exported value must
        be JSON-serializable. Use strings, numbers, booleans, arrays, plain
        objects, and <code>null</code>. Do not return JSX, functions, class
        instances, dates, maps, sets, or other non-JSON values from{" "}
        <code>data</code>.
      </p>
      <p>
        Because route modules run during discovery, top-level page code must be
        build-safe. Avoid browser-only globals like <code>window</code>, network
        side effects, and code that depends on request-time state.
      </p>
      <p>
        Keep JSX in the page component and keep shared metadata in{" "}
        <code>data</code>. That split keeps route files local while still giving
        the rest of the site typed content data.
      </p>
    </Doc>
  )
}
