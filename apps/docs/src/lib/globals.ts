import globals from "sitex:globals"

export type NavigationLink = {
  href: string
  label: string
}

export type NavigationGroup = {
  label: string
  links: readonly NavigationLink[]
}

export type SidebarSection = {
  label: string
  href: string
  navigation: readonly NavigationGroup[]
}

export type DocsGlobals = {
  name: string
  logo: {
    label: string
    href: string
  }
  header: {
    githubRepo: string
    navigation: readonly NavigationLink[]
  }
  sidebar: {
    sections: readonly SidebarSection[]
  }
}

const docsGlobals = globals as DocsGlobals

export { docsGlobals as globals }

export const docsNavigation = docsGlobals.sidebar.sections.flatMap((section) =>
  section.navigation.flatMap((group) => group.links)
)
