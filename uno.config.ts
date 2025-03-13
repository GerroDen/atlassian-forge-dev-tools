import presetChromeDevTools from "./unocss-preset-chrome-dev-tools";
import { defineConfig, presetIcons, presetWind3 } from "unocss";

export default defineConfig({
  presets: [presetWind3(), presetIcons(), presetChromeDevTools()],
});
