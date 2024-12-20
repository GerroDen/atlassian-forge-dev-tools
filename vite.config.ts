import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import oxlintPlugin from "vite-plugin-oxlint";
import webExtension from "vite-plugin-web-extension";
import packageJson from "./package.json" with { type :"json" };
import UnoCSS from 'unocss/vite'

export default defineConfig(({ mode }) => {
  let watch = undefined;
  if (mode === "development") {
    watch = { include: "src/**" };
  }
  return {
    build: {
      emptyOutDir: true,
      watch,
    },
    plugins: [
      oxlintPlugin(),
      checker({
        typescript: true,
        vueTsc: true,
      }),
      vue(),
      UnoCSS(),
      webExtension({
        manifest: () => {
          return {
            manifest_version: 3,
            name: "Atlassian Forge Dev Tools",
            version: packageJson.version,
            description: "",
            devtools_page: "src/devtools/index.html",
          };
        },
        additionalInputs: ["src/panel/index.html"],
        disableAutoLaunch: true,
      }),
    ],
  };
});
