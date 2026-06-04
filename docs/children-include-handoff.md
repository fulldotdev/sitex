# `children:include` Handoff

This document captures the removed `children:include` experiment so it can be
revisited later without rediscovering the same design decisions.

## Current Decision

`children:include` is intentionally disabled for now.

The current Sitex island model is:

```tsx
<Component client:load>
  <Child />
</Component>
```

- `Component` is hydrated as a client island.
- `Child` is rendered as static HTML.
- The child stays visible.
- The child does not get React event handlers, state, or context.

If a child needs interactivity today, mark it as its own island:

```tsx
<Component client:load>
  <Child client:load />
</Component>
```

This keeps v0 simple, predictable, and cheap.

## Proposed Future API

The preferred syntax for full subtree hydration was:

```tsx
<Component client:load children:include>
  <Child />
</Component>
```

Meaning:

- `client:*` controls the client render/hydration timing.
- `children:include` controls the hydration scope.
- With `children:include`, the parent and children become one React tree.

Examples:

```tsx
<Dashboard client:load children:include>
  <Filters />
  <Results />
</Dashboard>
```

Both `Dashboard` and its children hydrate together, so React context, state, and
event behavior can cross the parent/child boundary.

```tsx
<Map client:only children:include>
  <Markers />
</Map>
```

The whole tree renders only in the browser.

## Why It Was Removed

The feature worked, but it added a second island compilation path:

- normal component islands
- generated virtual subtree islands

That made the framework harder to reason about while the core API is still
settling. The performance default also becomes easier to misuse: one
`children:include` can ship a much larger subtree to the browser.

For the current Sitex use case, static children already solve the important
shell/layout case:

```tsx
<BaseLayout client:load>
  <ArticlePage />
</BaseLayout>
```

The shell can hydrate while the page body stays static.

## Expected Behavior

Without `children:include`:

```tsx
<Provider client:load>
  <Consumer />
</Provider>
```

- `Provider` is the island.
- `Consumer` is static HTML.
- `Consumer` cannot read live React context from `Provider`.
- Child buttons do not update.

With `children:include`:

```tsx
<Provider client:load children:include>
  <Consumer />
</Provider>
```

- `Provider` and `Consumer` are the same island.
- Both hydrate as one React tree.
- `Consumer` can read context from `Provider`.
- Parent and child buttons can update the same state.

## Implementation Sketch

The prior implementation approach was:

1. Detect `children:include` during the Vite transform.
2. Strip Sitex directives from the original JSX subtree.
3. Generate a virtual module for that exact subtree.
4. Register that virtual module in `virtual:sitex-islands`.
5. Replace the original JSX with a `SitexIsland` pointing at the generated
   subtree island.

Conceptually:

```tsx
<Counter client:load children:include initialCount={30}>
  <Counter initialCount={31} />
</Counter>
```

becomes:

```tsx
<SitexIsland
  component={__SitexTreeIsland0}
  id="/src/pages/examples.tsx:tree-0"
  mode="load"
  props={{}}
/>
```

And Sitex registers a virtual module like:

```tsx
import { Counter } from "/src/components/counter.tsx"

export default function SitexTreeIsland() {
  return (
    <Counter initialCount={30}>
      <Counter initialCount={31} />
    </Counter>
  )
}
```

The client runtime imports that virtual module and hydrates/renders it as a
normal island:

```ts
hydrateRoot(element, createElement(TreeIsland))
```

## Files That Were Involved

The removed experiment touched:

- `src/vite/plugin.ts`
- `src/types/virtual.d.ts`
- `src/pages/examples.tsx`
- `src/components/shared-counter.tsx`

The important framework pieces were:

- `TreeIsland` registry type
- `virtual:sitex-tree:*` module IDs
- `createTreeIslandCode(...)`
- `stripSitexDirectives(...)`
- `readChildrenInclude(...)`
- `children:include` JSX typing

## Verification Test To Recreate

Create a shared context component:

```tsx
const SharedCounterContext = createContext(null)

export function SharedCounterProvider({ children }) {
  const [count, setCount] = useState(0)

  return (
    <SharedCounterContext.Provider value={{ count, setCount }}>
      <button onClick={() => setCount(count + 1)}>Parent: {count}</button>
      {children}
    </SharedCounterContext.Provider>
  )
}

export function SharedCounterConsumer() {
  const context = useContext(SharedCounterContext)

  return (
    <button onClick={() => context.setCount(context.count + 1)}>
      Child: {context.count}
    </button>
  )
}
```

Then test:

```tsx
<SharedCounterProvider client:load>
  <SharedCounterConsumer />
</SharedCounterProvider>
```

Expected:

- child remains static
- child does not update parent context

And:

```tsx
<SharedCounterProvider client:load children:include>
  <SharedCounterConsumer />
</SharedCounterProvider>
```

Expected:

- both buttons show the same count
- clicking either button updates both labels

## Recommendation

Do not re-add this until a real project needs shared React state across a parent
island and nested children. Most static site/layout use cases are better served
by:

- hydrating the shell as one island
- keeping page content static
- marking small interactive children as their own islands

When reintroduced, keep the API as `children:include`; it matches the
domain-based directive style:

```tsx
client:load
client:only
server:defer
children:include
```
