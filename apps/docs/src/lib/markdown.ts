/** A page's Markdown version: /docs/pages at /docs/pages.md, the homepage at /index.md. */
export const markdownPath = (path: string) =>
  `${path.replace(/\/$/, "") || "/index"}.md`
