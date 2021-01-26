"use strict";

const {
  builders: { hardline, markAsRoot },
} = require("../document");

// In some markdown processors such as pandoc,
// "..." can be used as the end delimiter for YAML front-matter.

// trailing spaces after delimiters are allowed
const frontMatterRegex = /^(?<startDelimiter>-{3}|\+{3})(?<language>[^\n]*)\n(?:|(?<value>[\S\s]*?)\n)(?<endDelimiter>\k<startDelimiter>|\.{3})[^\S\n]*(?:\n|$)/;

function parse(text) {
  const match = text.match(frontMatterRegex);
  if (!match) {
    return { content: text };
  }

  const { startDelimiter, language, value = "", endDelimiter } = match.groups;

  let lang = language.trim() || "yaml";
  if (startDelimiter === "+++") {
    lang = "toml";
  }

  // Only allow yaml to parse with a different end delimiter
  if (language !== "yaml" && startDelimiter !== endDelimiter) {
    return { content: text };
  }

  const [raw] = match;
  const frontMatter = {
    type: "front-matter",
    lang,
    value,
    startDelimiter,
    endDelimiter,
    raw: raw.replace(/\n$/, ""),
  };

  return {
    frontMatter,
    content: raw.replace(/[^\n]/g, " ") + text.slice(raw.length),
  };
}

function print(node, textToDoc) {
  if (node.lang === "yaml") {
    const value = node.value.trim();
    const doc = value
      ? textToDoc(value, { parser: "yaml" }, { stripTrailingHardline: true })
      : "";
    return markAsRoot([
      node.startDelimiter,
      hardline,
      doc,
      doc ? hardline : "",
      node.endDelimiter,
    ]);
  }
}

module.exports = { parse, print };
