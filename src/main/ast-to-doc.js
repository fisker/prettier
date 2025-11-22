import AstPath from "../common/ast-path.js";
import { cursor, inheritLabel } from "../document/index.js";
import { attachComments } from "./comments/attach.js";
import { ensureAllCommentsPrinted, printComments } from "./comments/print.js";
import createPrintPreCheckFunction from "./create-print-pre-check-function.js";
import { printEmbeddedLanguages } from "./multiparser.js";
import printIgnored from "./print-ignored.js";

/**
 * Takes an abstract syntax tree (AST) and recursively converts it to a
 * document (series of printing primitives).
 *
 * This is done by descending down the AST recursively. The recursion
 * involves two functions that call each other:
 *
 * 1. mainPrint(), which is defined as an inner function here.
 *    It basically takes care of node caching.
 * 2. callPluginPrintFunction(), which checks for some options, and
 *    ultimately calls the print() function provided by the plugin.
 *
 * The plugin function will call mainPrint() again for child nodes
 * of the current node. mainPrint() will do its housekeeping, then call
 * the plugin function again, and so on.
 *
 * All the while, these functions pass a "path" variable around, which
 * is a stack-like data structure (AstPath) that maintains the current
 * state of the recursion. It is called "path", because it represents
 * the path to the current node through the Abstract Syntax Tree.
 */
async function printAstToDoc(ast, options) {
  const perfProfile = options.__perfProfile;
  const subProfile = perfProfile ? {} : null;

  const startPrepareToPrint = perfProfile ? performance.now() : 0;
  ({ ast } = await prepareToPrint(ast, options));
  if (perfProfile) {
    subProfile.prepareToPrint = performance.now() - startPrepareToPrint;
  }

  const cache = new Map();
  const path = new AstPath(ast);

  const ensurePrintingNode = createPrintPreCheckFunction(options);
  const embeds = new Map();

  const startEmbeds = perfProfile ? performance.now() : 0;
  await printEmbeddedLanguages(path, mainPrint, options, printAstToDoc, embeds);
  if (perfProfile) {
    subProfile.embeddedLanguages = performance.now() - startEmbeds;
  }

  // Only the root call of the print method is awaited.
  // This is done to make things simpler for plugins that don't use recursive printing.
  const startMainPrint = perfProfile ? performance.now() : 0;
  const doc = await callPluginPrintFunction(
    path,
    options,
    mainPrint,
    undefined,
    embeds,
  );
  if (perfProfile) {
    subProfile.mainPrint = performance.now() - startMainPrint;
  }

  ensureAllCommentsPrinted(options);

  if (perfProfile && options.__astToDocProfile) {
    Object.assign(options.__astToDocProfile, subProfile);
  }

  if (options.cursorOffset >= 0) {
    if (options.nodeAfterCursor && !options.nodeBeforeCursor) {
      return [cursor, doc];
    }
    if (options.nodeBeforeCursor && !options.nodeAfterCursor) {
      return [doc, cursor];
    }
  }

  return doc;

  function mainPrint(selector, args) {
    // Fast path: undefined or path object (most common case)
    if (!selector || selector === path) {
      return mainPrintInternal(args);
    }

    // Array path (e.g., ["body", 0])
    if (Array.isArray(selector)) {
      return path.call(() => mainPrintInternal(args), ...selector);
    }

    // String path (e.g., "body")
    return path.call(() => mainPrintInternal(args), selector);
  }

  function mainPrintInternal(args) {
    ensurePrintingNode(path);

    const value = path.node;

    // Fast path for null/undefined - most common early return
    if (!value) {
      return "";
    }

    // Optimize cache check - avoid redundant type check since we already know value is truthy
    // and cache only works for objects without args
    if (args === undefined && typeof value === "object") {
      const cached = cache.get(value);
      if (cached !== undefined) {
        return cached;
      }

      const doc = callPluginPrintFunction(path, options, mainPrint, args, embeds);
      cache.set(value, doc);
      return doc;
    }

    return callPluginPrintFunction(path, options, mainPrint, args, embeds);
  }
}

function callPluginPrintFunction(path, options, printPath, args, embeds) {
  const { node } = path;
  const { printer } = options;

  // Fast path: Most nodes don't have prettier-ignore, embeds, or cursor handling
  // Check embeds first as it's a simple Map lookup (common for JSX)
  let doc;
  if (embeds.has(node)) {
    doc = embeds.get(node);
  } else if (printer.hasPrettierIgnore?.(path)) {
    // Escape hatch - rare case
    doc = printIgnored(path, options, printPath, args);
  } else {
    // Hot path - direct printer call
    doc = printer.print(path, options, printPath, args);
  }

  // Cursor handling - only happens during cursor offset calculation (rare)
  // eslint-disable-next-line unicorn/prefer-switch -- Performance: if-else is faster than switch for 3 cases
  if (node === options.cursorNode) {
    doc = inheritLabel(doc, (doc) => [cursor, doc, cursor]);
  } else if (node === options.nodeBeforeCursor) {
    doc = inheritLabel(doc, (doc) => [doc, cursor]);
  } else if (node === options.nodeAfterCursor) {
    doc = inheritLabel(doc, (doc) => [cursor, doc]);
  }

  // Comment printing - check printComment first as it's more common than willPrintOwnComments
  if (printer.printComment && !printer.willPrintOwnComments?.(path, options)) {
    // printComments will call the plugin print function and check for
    // comments to print
    doc = printComments(path, doc, options);
  }

  return doc;
}

async function prepareToPrint(ast, options) {
  const perfProfile = options.__perfProfile;
  const subProfile = perfProfile && options.__astToDocProfile ? {} : null;

  const comments = ast.comments ?? [];
  options[Symbol.for("comments")] = comments;
  // For JS printer to ignore attached comments
  options[Symbol.for("printedComments")] = new Set();

  const startAttachComments = perfProfile ? performance.now() : 0;
  attachComments(ast, options);
  if (subProfile) {
    subProfile.attachComments = performance.now() - startAttachComments;
  }

  const {
    printer: { preprocess },
  } = options;

  const startPreprocess = perfProfile ? performance.now() : 0;
  ast = preprocess ? await preprocess(ast, options) : ast;
  if (subProfile) {
    subProfile.preprocess = performance.now() - startPreprocess;
  }

  if (subProfile) {
    Object.assign(options.__astToDocProfile, subProfile);
  }

  return { ast, comments };
}

export { prepareToPrint, printAstToDoc };
