export default function (replacements = {}) {
  return {
    name: "replace-modules",

    load(importee) {
      if (!Reflect.has(replacements, importee)) {
        return;
      }

      let replacement = replacements[importee];
      if (typeof replacement === "string") {
        replacement = {
          code: `export default eval("require")("${replacement}");`,
        };
      }

      return replacement.code;
    },
  };
}
