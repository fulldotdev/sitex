import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CodeBlock } from "@/components/ui/code-block"
import Doc from "@/components/layouts/doc"

export default function InstallationPage() {
  return (
    <Doc
      title="Installation"
      description="Install SiteX and add the Vite and TypeScript configuration."
      path="/docs/installation"
      doc={{
        title: "Installation",
        description:
          "Install SiteX and add the Vite and TypeScript configuration.",
        tocItems: [
          { href: "#ai-agent-install", label: "AI agent install" },
          { href: "#manual-install", label: "Manual install" },
          { href: "#vite-config", label: "Vite config" },
          { href: "#tsconfig", label: "TypeScript config" },
          { href: "#scripts", label: "Scripts" },
          { href: "#build-behavior", label: "Build behavior" },
          { href: "#first-page", label: "First page" },
        ],
      }}
    >
      <Alert className="border-primary/25 bg-primary/10 py-4 shadow-sm">
        <AlertTitle>Installing with an AI agent?</AlertTitle>
        <AlertDescription className="mt-1 leading-6">
          Share this page URL with your agent and ask it to follow the SiteX
          installation instructions exactly.
        </AlertDescription>
      </Alert>

      <h2 id="ai-agent-install">AI agent install</h2>
      <p>
        Give your agent this instruction from inside the project you want to set
        up:
      </p>
      <CodeBlock
        lang="text"
        code={`Read https://sitex.full.dev/docs/installation/ and install SiteX in this project.
Follow the manual install steps on that page: install the package, add the Vite plugin,
extend the SiteX TypeScript config, add the scripts, and create the first route.`}
      />

      <h2 id="manual-install">Manual install</h2>
      <p>
        Install the SiteX package together with the React and Vite packages your
        app needs.
      </p>
      <CodeBlock
        lang="bash"
        code={`pnpm add @fulldotdev/sitex react react-dom vite @vitejs/plugin-react
pnpm add -D typescript @types/react @types/react-dom`}
      />
      <p>
        If pnpm asks about dependency build scripts, approve the packages your
        project trusts in your workspace configuration.
      </p>

      <h2 id="vite-config">Vite config</h2>
      <p>
        Add the SiteX plugin to <code>vite.config.ts</code>. Set{" "}
        <code>appType</code> to <code>custom</code> so Vite does not expect a
        normal single-page app fallback.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { defineConfig } from "vite"
import { sitex } from "@fulldotdev/sitex/plugin"
import react from "@vitejs/plugin-react"

export default defineConfig({
  appType: "custom",
  plugins: [react(), sitex()],
})`}
      />

      <h2 id="tsconfig">TypeScript config</h2>
      <p>
        Extend the SiteX TypeScript config so JSX client directives like{" "}
        <code>client:load</code> and <code>client:only</code> are accepted.
      </p>
      <CodeBlock
        lang="json"
        code={`{
  "extends": "@fulldotdev/sitex/tsconfig",
  "include": ["src/**/*", "vite.config.ts"],
  "exclude": ["dist"],
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}`}
      />

      <h2 id="scripts">Scripts</h2>
      <p>
        SiteX runs through Vite. Use the normal Vite commands for development,
        production builds, and local previews.
      </p>
      <CodeBlock
        lang="json"
        code={`{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  }
}`}
      />

      <h2 id="build-behavior">Build behavior</h2>
      <p>
        <code>vite dev</code> starts the development server and lets SiteX
        render routes from <code>src/pages</code> on request.
      </p>
      <p>
        <code>vite build</code> writes static HTML to <code>dist</code>. SiteX
        emits one HTML file per static route, injects the production CSS, and
        adds the island client script only when a page needs client rendering.
      </p>
      <p>
        <code>vite preview</code> serves the built output locally, so you can
        verify the same static files that will be deployed.
      </p>
      <p>
        Import CSS from routes, layouts, or components. SiteX builds those files
        with Vite and injects the production stylesheet links into generated
        HTML.
      </p>

      <h2 id="first-page">First page</h2>
      <p>
        Create <code>src/pages/index.tsx</code>. Page files in{" "}
        <code>src/pages</code> become static routes.
      </p>
      <CodeBlock
        lang="tsx"
        code={`export default function HomePage() {
  return (
    <html lang="en">
      <head>
        <title>My SiteX site</title>
        <meta name="description" content="My first SiteX page." />
      </head>
      <body>
        <h1>Hello from SiteX</h1>
      </body>
    </html>
  )
}`}
      />
    </Doc>
  )
}
