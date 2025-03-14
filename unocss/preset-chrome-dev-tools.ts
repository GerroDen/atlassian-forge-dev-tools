import themeTokens from "./chrome-dev-tools-tokens.json" with { type: "json" };
import { definePreset } from "unocss";

export default definePreset({
  name: "chrome-dev-tools",
  theme: themeTokens,
  rules: [
    [
      /font-(\w+)-(\w+)/,
      ([, name, variant], { theme }) => ({
        font: theme.typescale[name][variant],
      }),
    ],
  ],
});
