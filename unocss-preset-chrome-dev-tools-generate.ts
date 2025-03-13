import { setWith } from "lodash-es";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { inspect } from "node:util";

const cssFile = resolve(__dirname, "node_modules/chrome-devtools-frontend/front_end/design_system_tokens.css");
const cssPropertyPattern = /\s--([\w\d-]+): .*?;\s/g;
const theme: Record<string, unknown> = {};
const cssString = await readFile(cssFile, { encoding: "utf8" });
let matches: string[] | null;
while ((matches = cssPropertyPattern.exec(cssString))) {
  const [, property] = matches;
  let propPath = property
    .replace(/^sys-/, "sys.")
    .replace("-", ".")
    .replace(/-./g, (match) => match.slice(1).toUpperCase());
  if (!propPath.startsWith("sys.") && !propPath.startsWith("ref.")) {
    propPath = `text.${propPath}`;
  }
  setWith(theme, propPath, `var(--${property})`, Object);
}

const serializedTheme = inspect(theme, { depth: null, maxStringLength: null, maxArrayLength: null, breakLength: null, sorted: true }).replace(/^\s/gm, "     ");
const presetModule = `// generated file with \`unocss-preset-chrome-dev-tools-generate.ts\`
import { definePreset, PresetFactory } from "unocss";

export default definePreset(async () => {
  return {
    theme: ${serializedTheme},
  };
}) as PresetFactory;
`;

await writeFile("unocss-preset-chrome-dev-tools.ts", presetModule);
