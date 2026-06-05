import assert from "node:assert/strict"

import { parseAst } from "vite-plus"

import { transformClientDirectives } from "../src/hydration/compiler.ts"

const root = "/repo"
const page = "/repo/src/pages/index.tsx"

function transform(code) {
  const registry = new Map()
  const output = transformClientDirectives(code, page, root, registry)

  assert.equal(typeof output, "string")
  parseAst(output, { lang: "tsx", sourceType: "module" }, "output.tsx")

  return { output, registry }
}

{
  const { output, registry } = transform(`
    import Widget from "../components/widget"
    export default function Page() {
      return <Widget client:load />
    }
  `)

  assert.match(output, /<SitexIsland component=\{Widget\}/)
  assert.match(output, /id=\{"\/src\/components\/widget\.tsx:default"\}/)
  assert.match(output, /mode=\{"load"\}/)
  assert.match(output, /props=\{\{\}\}/)
  assert.equal(registry.size, 1)
}

{
  const { output } = transform(`
    import { Widget } from "../components/widget"
    export default function Page() {
      return <Widget client:idle label="Docs" count={1} enabled {...extra} />
    }
  `)

  assert.match(output, /component=\{Widget\}/)
  assert.match(output, /id=\{"\/src\/components\/widget\.tsx:Widget"\}/)
  assert.match(output, /mode=\{"idle"\}/)
  assert.match(output, /label: "Docs"/)
  assert.match(output, /count: 1/)
  assert.match(output, /enabled: true/)
  assert.match(output, /\.\.\.extra/)
}

{
  const { output } = transform(`
    import Widget from "../components/widget"
    export default function Page() {
      return <Widget client:media="(min-width: 48rem)" />
    }
  `)

  assert.match(output, /mode=\{"media"\}/)
  assert.match(output, /media=\{"\(min-width: 48rem\)"\}/)
}

{
  const { output } = transform(`
    import Widget from "../components/widget"
    export default function Page() {
      return <Widget client:visible><span>child</span></Widget>
    }
  `)

  assert.match(
    output,
    /<SitexIsland component=\{Widget\}[^>]+><span>child<\/span><\/SitexIsland>/
  )
}

{
  const { output, registry } = transform(`
    import Outer from "../components/outer"
    import Inner from "../components/inner"
    export default function Page() {
      return <Outer client:load><Inner client:visible value={{ nested: true }} /></Outer>
    }
  `)

  assert.match(output, /component=\{Outer\}/)
  assert.match(output, /component=\{Inner\}/)
  assert.match(output, /value: \{ nested: true \}/)
  assert.equal(registry.size, 2)
}

assert.throws(
  () =>
    transform(`
      function Local() {
        return null
      }
      export default function Page() {
        return <Local client:load />
      }
    `),
  /requires an imported component/
)

assert.throws(
  () =>
    transform(`
      import Widget from "../components/widget"
      export default function Page() {
        return <Widget client:media />
      }
    `),
  /requires a string media query/
)
