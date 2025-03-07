import packageJson from "./package.json" with { type: "json" };
import vue from "@vitejs/plugin-vue";
import unocss from "unocss/vite";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import oxlintPlugin from "vite-plugin-oxlint";
import webExtension from "vite-plugin-web-extension";

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
      unocss(),
      webExtension({
        manifest: () => {
          return {
            manifest_version: 3,
            name: "Atlassian Forge Dev Tools",
            version: packageJson.version,
            description: "",
            devtools_page: "src/devtools/index.html",
            browser_specific_settings: {
              gecko: {
                id: "atlassian-forge-dev-tools@seibert.group",
              },
            },
          } satisfies chrome.runtime.ManifestV3;
        },
        additionalInputs: ["src/panel/index.html"],
        disableAutoLaunch: true,
      }),
    ],
  };
});
