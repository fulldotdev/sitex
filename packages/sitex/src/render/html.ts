import type { DefaultTreeAdapterMap } from "parse5"
import { parse, parseFragment, serialize } from "parse5"

type ChildNode = DefaultTreeAdapterMap["childNode"]
type Document = DefaultTreeAdapterMap["document"]
type Element = DefaultTreeAdapterMap["element"]
type ParentNode = DefaultTreeAdapterMap["parentNode"]

export type HtmlDocument = {
  body: Element
  document: Document
  head: Element
  html: Element
}

export function parseHtmlDocument(source: string): HtmlDocument {
  const document = parse(source)
  const html = findChildElement(document, "html")
  const head = html && findChildElement(html, "head")
  const body = html && findChildElement(html, "body")

  if (!html || !head || !body) {
    throw new Error(
      "Sitex could not read <html>, <head>, and <body> from the rendered page."
    )
  }

  return { body, document, head, html }
}

export function serializeHtmlDocument(htmlDocument: HtmlDocument) {
  const output = serialize(htmlDocument.document)

  return /^<!doctype/i.test(output) ? output : `<!DOCTYPE html>${output}`
}

export function getAttribute(element: Element, name: string) {
  return element.attrs.find((attr) => attr.name === name)?.value
}

export function setAttribute(element: Element, name: string, value: string) {
  const attr = element.attrs.find((entry) => entry.name === name)

  if (attr) {
    attr.value = value
    return
  }

  element.attrs.push({ name, value })
}

export function appendHtmlFragment(parent: Element, fragment: string) {
  const parsed = parseFragment(parent, fragment, {})

  for (const node of parsed.childNodes) {
    node.parentNode = parent
    parent.childNodes.push(node)
  }
}

export function findElements(
  parent: ParentNode,
  match: (element: Element) => boolean
) {
  const found: Element[] = []

  walkElements(parent, (element) => {
    if (match(element)) found.push(element)
  })

  return found
}

export function hasHeadElement(
  head: Element,
  tagName: string,
  match: (element: Element) => boolean
) {
  return head.childNodes.some(
    (node) => isElement(node) && node.tagName === tagName && match(node)
  )
}

export function removeElement(element: Element) {
  const parent = element.parentNode

  if (!parent) return

  const index = parent.childNodes.indexOf(element)

  if (index !== -1) parent.childNodes.splice(index, 1)

  element.parentNode = null
}

export function appendElement(parent: Element, element: Element) {
  element.parentNode = parent
  parent.childNodes.push(element)
}

export function escapeHtmlAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll(`"`, "&quot;")
    .replaceAll("'", "&apos;")
}

function walkElements(node: ParentNode, visit: (element: Element) => void) {
  for (const child of node.childNodes) {
    if (!isElement(child)) continue

    visit(child)

    if (child.tagName === "template" && "content" in child) {
      walkElements(child.content, visit)
      continue
    }

    walkElements(child, visit)
  }
}

function findChildElement(parent: ParentNode, tagName: string) {
  return parent.childNodes.find(
    (node): node is Element => isElement(node) && node.tagName === tagName
  )
}

function isElement(node: ChildNode): node is Element {
  return "tagName" in node
}
