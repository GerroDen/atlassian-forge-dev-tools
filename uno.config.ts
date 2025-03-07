import { defineConfig, presetIcons, presetWind3 } from "unocss";

export default defineConfig({
  presets: [presetWind3(), presetIcons()],
  theme: {
    colors: {
      dividerLine: "var(--divider-line)",
    },
  },
});
