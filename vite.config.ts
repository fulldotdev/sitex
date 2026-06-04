import { defineConfig } from "vite-plus"

export default defineConfig({
  fmt: {
    semi: false,
    singleQuote: false,
    printWidth: 80,
    trailingComma: "es5",
    ignorePatterns: ["docs/**"],
    sortPackageJson: false,
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    ignorePatterns: [
      "apps/*/dist/**",
      "apps/docs/src/components/ui/**",
      "apps/docs/src/hooks/use-mobile.ts",
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
