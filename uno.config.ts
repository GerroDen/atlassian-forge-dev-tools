import themeTokens from "./unocss/chrome-dev-tools-tokens.json";
import transformerDirectives from "@unocss/transformer-directives";
import { get } from "lodash-es";
import { defineConfig, Preset, presetIcons, presetMini } from "unocss";

export default defineConfig({
  presets: [presetMini(), presetIcons()],
  transformers: [transformerDirectives()],
  extendTheme: (theme) => ({
    ...theme,
    zIndex: theme.elevation,
    colors: themeTokens.colors,
    width: themeTokens.size,
    minWidth: themeTokens.size,
    maxWidth: themeTokens.size,
    height: themeTokens.size,
    minHeight: themeTokens.size,
    maxHeight: themeTokens.size,
    inlineSize: themeTokens.size,
    minInlineSize: themeTokens.size,
    maxInlineSize: themeTokens.size,
    blockSize: themeTokens.size,
    minBlockSize: themeTokens.size,
    maxBlockSize: themeTokens.size,
    borderRadius: themeTokens.shape.corner,
    typescale: themeTokens.typescale,
  }),
  rules: [
    [
      /^font-(\w+)-(\w+)$/,
      ([, name, variant], { theme }) => ({
        font: get(theme.typescale, [name, variant]),
      }),
    ],
  ] satisfies Preset<typeof themeTokens>["rules"],
  autocomplete: {
    templates: ["font-<typescale>-<type-variant>"],
    shorthands: {
      typescale: Object.keys(themeTokens.typescale),
      "type-variant": "(regular|medium|bold)",
    },
  },
});
