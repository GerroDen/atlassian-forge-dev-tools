import jsonStableStringify from "json-stable-stringify";
import { isString, setWith } from "lodash-es";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const cssSourceFile = resolve(__dirname, "../node_modules/chrome-devtools-frontend/front_end/design_system_tokens.css");
const jsonOutputFile = resolve(__dirname, "chrome-dev-tools-tokens.json");
const cssPropertyPattern = /\s--([\w\d-]+): .*?;\s/g;
const defaultProp = "DEFAULT";

const theme: Record<string, unknown> = {};
const cssString = await readFile(cssSourceFile, { encoding: "utf8" });
let matches: string[] | null;
while ((matches = cssPropertyPattern.exec(cssString))) {
  const [, property] = matches;
  let propPath = property
    .replace(/^sys-/, "")
    .replaceAll("-", ".")
    .replace("line.height", "lineHeight")
    .replace("extra.small", "extraSmall")
    .replace("font.family", "fontFamily")
    .replace("font.size", "fontSize");
  if (!property.startsWith("sys-") && !property.startsWith("ref-")) {
    propPath = `text.${propPath}`;
  }
  setWith(theme, propPath, `var(--${property})`, (nsValue, key, nsObject) => {
    if (isString(nsValue)) {
      return {
        [defaultProp]: nsValue,
      };
    }
    return Object(nsValue);
  });
}

const collator = new Intl.Collator("en", { numeric: true });
const orders = {
  sizes: ["extraSmall", "small", "medium", "large", "full"],
  typeScale: ["regular", "medium", "bold", "size", "lineHeight"],
};
const comparator = (a: { key: string; value: unknown }, b: { key: string; value: unknown }): number => {
  for (let order of Object.values(orders)) {
    if (order.includes(a.key) && order.includes(b.key)) {
      return order.indexOf(a.key) - order.indexOf(b.key);
    }
  }
  if (a.key === defaultProp) return -1;
  if (b.key === defaultProp) return 1;
  return collator.compare(a.key, b.key);
};
const serializedTheme = jsonStableStringify(theme, { space: 2, cmp: comparator }).replace(/^\s/gm, "     ");

await writeFile(jsonOutputFile, serializedTheme);
console.info(`wrote to ${jsonOutputFile}`);
