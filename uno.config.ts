import presetChromeDevTools from "./unocss/unocss-preset-chrome-dev-tools";
import { defineConfig, presetIcons, presetMini } from "unocss";

export default defineConfig({
  presets: [presetChromeDevTools(), presetIcons()],
});
