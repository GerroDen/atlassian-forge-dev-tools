import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import oxlintPlugin from "vite-plugin-oxlint";
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    oxlintPlugin(),
    checker({
      typescript: true,
      vueTsc: true,
    }),
    vue(),
    webExtension({
      manifest: "src/manifest.json",
      additionalInputs: ["src/panel/index.html"],
      disableAutoLaunch: true,
    }),
  ],
  build: {
    emptyOutDir: true,
    watch: {
      include: "src/**",
    },
  },
});
