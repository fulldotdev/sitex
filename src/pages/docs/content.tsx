import { CodeBlock } from "@/components/ui/code-block"
import Doc from "@/components/layouts/doc"

export const content = {
  title: "Content API",
  description: "Share route metadata with typed getPages and getPage helpers.",
  order: 4,
  tocItems: [
    { href: "#overview", label: "Overview" },
    { href: "#content-export", label: "content export" },
    { href: "#get-pages", label: "getPages" },
    { href: "#get-page", label: "getPage" },
    { href: "#typing", label: "Typing" },
    { href: "#limits", label: "Limits" },
  ],
}

export default function ContentPage() {
  return (
    <Doc
      title={content.title}
      description={content.description}
      path="/docs/content"
      doc={content}
    >
      <h2 id="overview">Overview</h2>
      <p>
        Route files can export a <code>content</code> object next to the page
        component. Sitex reads those exports and exposes them through{" "}
        <code>sitex:content</code>, so overview pages and layouts can build blog
        indexes, cards, previous and next links, sidebars, and metadata from the
        routes themselves.
      </p>
      <p>
        Paths use the same slash-prefixed shape as browser routes, such as{" "}
        <code>/docs/content</code>.
      </p>

      <h2 id="content-export">content export</h2>
      <p>
        Add <code>export const content</code> to any route that should be
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

export const content = {
  title: "Building content sites with React",
  description: "How route-owned content keeps pages local and reusable.",
  publishedAt: "2026-06-03",
  author: "Sil",
  tags: ["react", "content"],
} satisfies PostContent

export default function PostPage() {
  return (
    <article>
      <h1>{content.title}</h1>
      <p>{content.description}</p>
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

      <h2 id="get-pages">getPages</h2>
      <p>
        Use <code>getPages</code> to read all content exports, or pass a
        slash-prefixed path prefix to scope the result. A blog overview usually
        reads only <code>/blog</code> pages, sorts them, and maps them to cards.
      </p>
      <CodeBlock
        lang="tsx"
        code={`import { getPages } from "sitex:content"

const posts = await getPages("/blog")

export default function BlogPage() {
  return (
    <main>
      <h1>Blog</h1>
      <div>
        {posts
          .sort((a, b) => {
            return b.content.publishedAt.localeCompare(a.content.publishedAt)
          })
          .map((post) => (
            <article key={post.path}>
              <a href={post.path}>{post.content.title}</a>
              <p>{post.content.description}</p>
              <time dateTime={post.content.publishedAt}>
                {post.content.publishedAt}
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
        <code>/blog</code>. The return value is async, matching the shape of
        content APIs like Astro&apos;s <code>getCollection</code>.
      </p>

      <h2 id="get-page">getPage</h2>
      <p>
        Use <code>getPage</code> when you know the exact route path.
      </p>
      <CodeBlock
        lang="tsx"
        code={`import { getPage } from "sitex:content"

const post = await getPage("/blog/building-content-sites")

export default function FeaturedPost() {
  if (!post) {
    return null
  }

  return (
    <aside>
      <p>Featured post</p>
      <a href={post.path}>{post.content.title}</a>
      <p>{post.content.description}</p>
      <time dateTime={post.content.publishedAt}>
        {post.content.publishedAt}
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
        Sitex generates types for <code>sitex:content</code> from the actual{" "}
        <code>content</code> exports in <code>src/pages</code>. Editors can then
        infer fields like <code>title</code>, <code>description</code>,{" "}
        <code>publishedAt</code>, and <code>tags</code> when you call{" "}
        <code>getPages</code> or <code>getPage</code>.
      </p>
      <CodeBlock
        lang="ts"
        code={`type Page = {
  file: string
  path: string
  content: {
    title: string
    description: string
    publishedAt?: string
    author?: string
    tags?: string[]
  }
}`}
      />
      <p>
        Generated types describe what exists in the project. If you want to
        enforce a consistent shape across all blog posts, give the{" "}
        <code>content</code> export its own type. Prefer <code>satisfies</code>,
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

export const content = {
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
        exported <code>content</code> value. That means <code>content</code> can
        use imported values, constants, and helper functions.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { defaultAuthor } from "@/data/authors"

function createTags() {
  return ["react", "content"]
}

export const content = {
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
        <code>content</code>.
      </p>
      <p>
        Because route modules run during discovery, top-level page code must be
        build-safe. Avoid browser-only globals like <code>window</code>, network
        side effects, and code that depends on request-time state.
      </p>
      <p>
        Keep JSX in the page component and keep shared metadata in{" "}
        <code>content</code>. That split keeps route files local while still
        giving the rest of the site typed content data.
      </p>
    </Doc>
  )
}
