import { env } from "node:process";
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import vue from "@vitejs/plugin-vue";
import checker from "vite-plugin-checker";
import oxlintPlugin from "vite-plugin-oxlint";

export default defineConfig({
  plugins: [
    oxlintPlugin(),
    checker({
      typescript: true,
      vueTsc: true,
    }),
    vue(),
    webExtension(),
  ],
  define: {
    __BROWSER__: JSON.stringify(env.TARGET),
  },
});
