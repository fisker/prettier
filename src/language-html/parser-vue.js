"use strict";

const parseFrontMatter = require("../utils/front-matter");
const {
  HTML_ELEMENT_ATTRIBUTES,
  HTML_TAGS,
  isUnknownNamespace,
} = require("./utils");
const { hasPragma } = require("./pragma");
const createError = require("../common/parser-create-error");
const { Node } = require("./ast");
const { parseIeConditionalComment } = require("./conditional-comment");

function locStart(node) {
  return node.start;
}

function locEnd(node) {
  return node.end;
}

function parse(text, parsers, options) {
  const { parse, compileTemplate } = require("@vue/component-compiler-utils");
  const compiler = require("vue-template-compiler");

  const descriptor = parse({
    source: text,
    filename: "prettier.vue",
    compiler,
    compilerOptions: {
      outputSourceRange: true,
      whitespace: "preserve",
    },
    sourceRoot: "",
    needMap: false,
  });

  const { errors } = descriptor;

  if (errors.length) {
    const [error] = errors;
    throw createError(
      // babel error prints (l:c) with cols that are zero indexed
      // so we need our custom error
      error.message.replace(/ \(.*\)/, ""),
      {
        start: {
          line: error.loc.line,
          column: error.loc.column + 1,
        },
      }
    );
  }
  const ast = {
    type: "VRoot",
    children: [
      descriptor.template,
      descriptor.script,
      ...descriptor.styles,
      ...descriptor.customBlocks,
    ]
      .filter(Boolean)
      .sort((a, b) => a.start - b.start),
  };
  // console.log({ ast: ast.children });

  return ast;
}

module.exports = {
  parsers: {
    vue: {
      parse,
      hasPragma,
      astFormat: "vue-sfc",
      locStart,
      locEnd,
    },
  },
};
