import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { ostra } from "./framework/plugin";
import { globalSchema } from "./src/schemas/global";
import { articleSchema } from "./src/schemas/layouts/article";
import { homeSchema } from "./src/schemas/layouts/home";
import {
  noneLoadSchema,
  serverLoadSchema,
  serverNoneSchema,
  staticLoadSchema,
  staticNoneSchema,
} from "./src/schemas/layouts/mode";
import { pageSchema } from "./src/schemas/page";
import ArticleLayout from "./src/layouts/article";
import ShellLayout from "./src/layouts";
import HomeLayout from "./src/layouts/home";
import ModeLayout from "./src/layouts/mode";

export const ostraPlugin = ostra({
  globals: {
    schema: globalSchema,
  },
  shell: {
    layout: ShellLayout,
    client: "load",
  },
  pages: {
    schema: pageSchema,
    output: "static",
    client: "none",
    types: {
      article: {
        schema: articleSchema,
        layout: ArticleLayout,
      },
      home: {
        schema: homeSchema,
        layout: HomeLayout,
        client: "load",
      },
      "server-load": {
        schema: serverLoadSchema,
        layout: ModeLayout,
        output: "server",
        client: "load",
      },
      "server-none": {
        schema: serverNoneSchema,
        layout: ModeLayout,
        output: "server",
        client: "none",
      },
      "static-load": {
        schema: staticLoadSchema,
        layout: ModeLayout,
        output: "static",
        client: "load",
      },
      "static-none": {
        schema: staticNoneSchema,
        layout: ModeLayout,
        output: "static",
        client: "none",
      },
      "none-load": {
        schema: noneLoadSchema,
        layout: ModeLayout,
        output: "none",
        client: "load",
      },
    },
  },
});

export default defineConfig({
  appType: "custom",
  plugins: [ostraPlugin, react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
