"use strict";

const {
  builders: { concat, join, hardline },
} = require("../document");

function clean(ast, newNode) {
  delete newNode.start;
  delete newNode.end;
  delete newNode.content;
}

function embed(path, print, textToDoc, options) {
  const node = path.getValue();
  const { type, attrs } = node;
  if (type === "template" || type === "script" || type === "style") {
    try {
      return textToDoc(toHTML(path, options, /* asString */ true), {
        parser: "vue",
      });
    } catch (error) {
      // Do nothing
    }
  }
}

function toHTML(path, options, asString = false) {
  const node = path.getValue();
  const attrs = [...Object.entries(node.attrs)]
    .map(([key, value]) => (value === true ? key : `${key}="${value}"`))
    .join(" ");
  const content = options.originalText.slice(node.start, node.end);

  const parts = [
    `<${node.type}${attrs ? ` ${attrs}` : ""}>`,
    content,
    `</${node.type}>`,
  ];
  return asString ? parts.join("\n") : join("", parts);
}

function genericPrint(path, options, print) {
  const node = path.getValue();
  if (!node) {
    return "";
  }
  switch (node.type) {
    case "VRoot":
      return join(hardline, path.map(print, "children"));
    case "template":
    case "script":
    case "style":
      return node.context;
    default:
      return toHTML(path, options);
  }
}

module.exports = {
  print: genericPrint,
  insertPragma() {},
  massageAstNode: clean,
  embed,
};
