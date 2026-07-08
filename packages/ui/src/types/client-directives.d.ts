// Typecheck support for Sitex client directives inside registry sources.
// Consumers get this augmentation from @fulldotdev/sitex/virtual instead.
declare namespace React {
  interface Attributes {
    "client:idle"?: boolean
    "client:load"?: boolean
    "client:media"?: string
    "client:only"?: boolean
    "client:visible"?: boolean
  }
}
