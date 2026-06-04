import { defineConfig } from "vite-plus"

export default defineConfig({
  fmt: {
    semi: false,
    singleQuote: false,
    printWidth: 80,
    trailingComma: "es5",
    ignorePatterns: ["docs/**"],
    sortPackageJson: false,
    sortImports: {
      customGroups: [
        {
          groupName: "react-libs",
          elementNamePattern: ["react", "react/**"],
        },
        {
          groupName: "vite-libs",
          elementNamePattern: ["vite", "vite/**", "vite-plus", "vite-plus/**"],
        },
        {
          groupName: "sitex-libs",
          elementNamePattern: [
            "sitex",
            "sitex/**",
            "@fulldotdev/sitex",
            "@fulldotdev/sitex/**",
          ],
        },
        {
          groupName: "aliases",
          elementNamePattern: ["@/**"],
        },
      ],
      groups: [
        "type-import",
        "react-libs",
        "vite-libs",
        "sitex-libs",
        "value-builtin",
        "value-external",
        "aliases",
        ["value-parent", "value-sibling", "value-index"],
        "unknown",
      ],
    },
    sortTailwindcss: {
      stylesheet: "./apps/docs/src/styles/globals.css",
      functions: ["cn", "cva"],
      preserveWhitespace: true,
    },
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    ignorePatterns: [
      "apps/*/dist/**",
      "packages/sitex/**",
      "packages/*/package-dist/**",
      "**/.sitex/**",
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      "no-control-regex": "off",
    },
  },
  run: {
    cache: true,
  },
})
