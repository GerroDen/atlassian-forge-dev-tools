import themeTokens from "./unocss/chrome-dev-tools-tokens.json" with { type: "json" };
import transformerDirectives from "@unocss/transformer-directives";
import { get } from "lodash-es";
import { defineConfig, presetIcons, presetMini } from "unocss";

type Theme = typeof themeTokens;
export default defineConfig<Theme>({
  // @ts-expect-error TS2322 -- typing goes wild, object != Theme
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
  ],
  autocomplete: {
    templates: ["font-<typescale>-<type-variant>"],
    shorthands: {
      typescale: Object.keys(themeTokens.typescale),
      "type-variant": "(regular|medium|bold)",
    },
  },
});
