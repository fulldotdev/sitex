import type { JsonValue } from "../router/runtime.ts"

export function readJsonData(
  value: unknown,
  file: string
): { [key: string]: JsonValue } {
  const data = readJsonValue(value, file, "data", new WeakSet<object>())

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`Data in "${file}" must be a JSON object.`)
  }

  return data
}

function readJsonValue(
  value: unknown,
  file: string,
  keyPath: string,
  seen: WeakSet<object>
): JsonValue {
  if (
    typeof value === "string" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(
        `Data in "${file}" contains a non-finite number at ${keyPath}.`
      )
    }

    return value
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      throw new Error(`Data in "${file}" contains a circular value.`)
    }

    seen.add(value)

    const jsonArray = value.map((item, index) => {
      return readJsonValue(item, file, `${keyPath}[${index}]`, seen)
    })

    seen.delete(value)

    return jsonArray
  }

  if (typeof value === "object" && value !== null) {
    if (seen.has(value)) {
      throw new Error(`Data in "${file}" contains a circular value.`)
    }

    seen.add(value)

    const jsonObject: { [key: string]: JsonValue } = {}

    for (const [key, item] of Object.entries(value)) {
      jsonObject[key] = readJsonValue(item, file, `${keyPath}.${key}`, seen)
    }

    seen.delete(value)

    return jsonObject
  }

  throw new Error(
    `Data in "${file}" must be JSON-serializable. Unsupported value at ${keyPath}.`
  )
}
