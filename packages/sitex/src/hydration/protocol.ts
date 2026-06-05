export const hydrationModes = [
  "load",
  "only",
  "visible",
  "idle",
  "media",
] as const

export type HydrationMode = (typeof hydrationModes)[number]

export const hydrationAttributes = {
  island: "data-sitex-island",
  media: "data-sitex-media",
  mode: "data-sitex-mode",
  props: "data-sitex-props",
  staticChildren: "data-sitex-static-children",
} as const

export function isHydrationMode(value: unknown): value is HydrationMode {
  return hydrationModes.includes(value as HydrationMode)
}

export function serializeHydrationProps(props: Record<string, unknown>) {
  validateHydrationValue(props, "props", new WeakSet())

  return JSON.stringify(props).replaceAll("<", "\\u003c")
}

export function parseHydrationProps(value: string | null) {
  return value ? (JSON.parse(value) as Record<string, unknown>) : {}
}

function validateHydrationValue(
  value: unknown,
  path: string,
  seen: WeakSet<object>
) {
  if (value === null) return

  const valueType = typeof value

  if (valueType === "string" || valueType === "boolean") return

  if (valueType === "number") {
    if (!Number.isFinite(value)) {
      throwInvalidProp(path, "non-finite numbers cannot be serialized")
    }

    return
  }

  if (valueType === "bigint") {
    throwInvalidProp(path, "bigints cannot be serialized")
  }

  if (valueType === "undefined") {
    throwInvalidProp(path, "undefined values would be dropped")
  }

  if (valueType === "function") {
    throwInvalidProp(path, "functions cannot cross the island boundary")
  }

  if (valueType === "symbol") {
    throwInvalidProp(path, "symbols cannot be serialized")
  }

  if (valueType !== "object") return

  const objectValue = value as Record<string | symbol, unknown>

  if (seen.has(objectValue)) {
    throwInvalidProp(path, "cyclic objects cannot be serialized")
  }

  if (isReactElement(objectValue)) {
    throwInvalidProp(path, "React elements cannot cross the island boundary")
  }

  seen.add(objectValue)

  if (Array.isArray(objectValue)) {
    objectValue.forEach((item, index) => {
      validateHydrationValue(item, `${path}[${index}]`, seen)
    })
    seen.delete(objectValue)
    return
  }

  const prototype = Object.getPrototypeOf(objectValue)

  if (prototype !== Object.prototype && prototype !== null) {
    throwInvalidProp(path, "only plain objects and arrays can be serialized")
  }

  for (const key of Reflect.ownKeys(objectValue)) {
    if (typeof key === "symbol") {
      throwInvalidProp(path, "symbol keys cannot be serialized")
    }

    validateHydrationValue(objectValue[key], `${path}.${key}`, seen)
  }

  seen.delete(objectValue)
}

function isReactElement(value: Record<string | symbol, unknown>) {
  return Reflect.ownKeys(value).some(
    (key) =>
      typeof key === "symbol" &&
      (key.description === "react.element" ||
        key.description === "react.transitional.element")
  )
}

function throwInvalidProp(path: string, reason: string): never {
  throw new Error(`Invalid Sitex island prop at ${path}: ${reason}.`)
}

export {
  hydrationAttributes as islandAttributes,
  hydrationModes as islandModes,
  isHydrationMode as isIslandMode,
  parseHydrationProps as parseIslandProps,
  serializeHydrationProps as serializeIslandProps,
  type HydrationMode as IslandMode,
}
