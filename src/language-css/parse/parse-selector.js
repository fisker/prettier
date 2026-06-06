import postcssSelectorParser from "postcss-selector-parser";
import { addTypePrefix } from "./utilities.js";

function normalizeSelectorForParser(selector) {
  let normalizedSelector = "";

  for (let index = 0; index < selector.length; index++) {
    if (selector[index] !== "[") {
      normalizedSelector += selector[index];
      continue;
    }

    let content = "";
    let quote;
    let escaped = false;
    let closed = false;

    for (index++; index < selector.length; index++) {
      const character = selector[index];

      if (escaped) {
        escaped = false;
        content += character;
        continue;
      }

      if (character === "\\") {
        escaped = true;
        content += character;
        continue;
      }

      if (quote) {
        if (character === quote) {
          quote = undefined;
        }
        content += character;
        continue;
      }

      if (character === "'" || character === '"') {
        quote = character;
        content += character;
        continue;
      }

      if (character === "]") {
        closed = true;
        break;
      }

      content += character;
    }

    if (!closed) {
      normalizedSelector += "[" + content;
      continue;
    }

    const normalizedContent =
      content.includes("'") || content.includes('"')
        ? content
        : content
            .replaceAll(/\s*([|~^$*]?=)\s*/g, "$1")
            .replaceAll(/\s*\|\s*/g, "|")
            .trim();

    normalizedSelector += `[${normalizedContent || content}]`;
  }

  return normalizedSelector;
}

function parseSelector(selector) {
  // If there's a comment inside of a selector, the parser tries to parse
  // the content of the comment as selectors which turns it into complete
  // garbage. Better to print the whole selector as-is and not try to parse
  // and reformat it.
  if (/\/[/*]/.test(selector.replaceAll(/"[^"]+"|'[^']+'/g, ""))) {
    return {
      type: "selector-unknown",
      value: selector.trim(),
    };
  }

  let result;
  const parser = postcssSelectorParser();

  try {
    result = parser.astSync(selector);
  } catch {
    const normalizedSelector = normalizeSelectorForParser(selector);
    if (normalizedSelector !== selector) {
      try {
        result = parser.astSync(normalizedSelector);
      } catch {
        // Ignore and fall through to unknown selector return.
      }
    }

    if (!result) {
      // Fail silently. It's better to print it as is than to try and parse it
      // Note: A common failure is for SCSS nested properties. `background:
      // none { color: red; }` is parsed as a NestedDeclaration by
      // postcss-scss, while `background: { color: red; }` is parsed as a Rule
      // with a selector ending with a colon. See:
      // https://github.com/postcss/postcss-scss/issues/39
      return {
        type: "selector-unknown",
        value: selector,
      };
    }
  }

  return addTypePrefix(result, "selector-");
}

export default parseSelector;
