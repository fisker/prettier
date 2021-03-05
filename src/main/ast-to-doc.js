"use strict";

const assert = require("assert");
const AstPath = require("../common/ast-path");
const {
  builders: { hardline, addAlignmentToDoc },
  utils: { propagateBreaks },
} = require("../document");
const { printComments } = require("./comments");
const { printSubtree } = require("./multiparser");

/**
 * Takes an abstract syntax tree (AST) and recursively converts it to a
 * document (series of printing primitives).
 *
 * This is done by descending down the AST recursively. The recursion
 * involves two functions that call each other:
 *
 * 1. printGenerically(), which is defined as an inner function here.
 *    It basically takes care of node caching.
 * 2. callPluginPrintFunction(), which checks for some options, and
 *    ultimately calls the print() function provided by the plugin.
 *
 * The plugin function will call printGenerically() again for child nodes
 * of the current node, which will do its housekeeping, then call the
 * plugin function again, and so on.
 *
 * All the while, these functions pass a "path" variable around, which
 * is a stack-like data structure (AstPath) that maintains the current
 * state of the recursion. It is called "path", because it represents
 * the path to the current node through the Abstract Syntax Tree.
 */
function printAstToDoc(ast, options, alignmentSize = 0) {
  const {
    preprocess = (ast) => ast,
    willPrintOwnComments = () => false,
    hasPrettierIgnore = () => false,
    print,
  } = options.printer;

  ast = preprocess(ast, options);

  const cache = new Map();
  const path = new AstPath(ast);

  function printGenerically(_, args) {
    const node = path.getValue();

    const shouldCache = node && typeof node === "object" && args === undefined;
    if (shouldCache && cache.has(node)) {
      return cache.get(node);
    }

    let doc;
    // Escape hatch
    if (hasPrettierIgnore(path)) {
      doc = printPrettierIgnoredNode(node, options);
    } else {
      if (node) {
        doc = tryPrintSubtree(path, printGenerically, options);
      }
      if (!doc) {
        doc = print(path, options, printGenerically, args);
      }
    }

    // We let JSXElement print its comments itself because it adds () around
    // UnionTypeAnnotation has to align the child without the comments
    if (!willPrintOwnComments(path, options)) {
      // printComments will call the plugin print function and check for
      // comments to print
      doc = printComments(path, doc, options, args && args.needsSemi);
    }

    if (shouldCache) {
      cache.set(node, doc);
    }

    return doc;
  }

  let doc = printGenerically();
  if (alignmentSize > 0) {
    // Add a hardline to make the indents take effect
    // It should be removed in index.js format()
    doc = addAlignmentToDoc([hardline, doc], alignmentSize, options.tabWidth);
  }
  propagateBreaks(doc);

  return doc;
}

function printPrettierIgnoredNode(node, options) {
  const {
    originalText,
    [Symbol.for("comments")]: comments,
    locStart,
    locEnd,
  } = options;

  const start = locStart(node);
  const end = locEnd(node);

  for (const comment of comments) {
    if (locStart(comment) >= start && locEnd(comment) <= end) {
      comment.printed = true;
    }
  }

  return originalText.slice(start, end);
}

function tryPrintSubtree(path, printGenerically, options) {
  try {
    // Potentially switch to a different parser
    return printSubtree(path, printGenerically, options, printAstToDoc);
  } catch (error) {
    /* istanbul ignore if */
    if (process.env.PRETTIER_DEBUG) {
      throw error;
    }
    // Continue with current parser
  }
}

module.exports = printAstToDoc;
