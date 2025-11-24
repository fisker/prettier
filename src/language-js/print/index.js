import { group, indent, inheritLabel, line } from "../../document/index.js";
import isNonEmptyArray from "../../utils/is-non-empty-array.js";
import { locEnd, locStart } from "../loc.js";
import pathNeedsParens from "../needs-parens.js";
import { createTypeCheckFunction } from "../utils/index.js";
import isIgnored from "../utils/is-ignored.js";
import { printAngular } from "./angular.js";
import { printDecorators } from "./decorators.js";
import { printEstree } from "./estree.js";
import { printFlow } from "./flow.js";
import { printJsx } from "./jsx.js";
import { shouldPrintLeadingSemicolon } from "./semicolon.js";
import { printTypescript } from "./typescript.js";

/**
 * @import AstPath from "../../common/ast-path.js"
 * @import {Doc} from "../../document/index.js"
 */

function printWithoutParentheses(path, options, print, args) {
  for (const printer of [
    printAngular,
    printJsx,
    printFlow,
    printTypescript,
    printEstree,
  ]) {
    const doc = printer(path, options, print, args);
    if (doc !== undefined) {
      return doc;
    }
  }
}

// Their decorators are handled themselves, and they don't need parentheses or leading semicolons
const shouldPrintDirectly = createTypeCheckFunction([
  "ClassMethod",
  "ClassPrivateMethod",
  "ClassProperty",
  "ClassAccessorProperty",
  "AccessorProperty",
  "TSAbstractAccessorProperty",
  "PropertyDefinition",
  "TSAbstractPropertyDefinition",
  "ClassPrivateProperty",
  "MethodDefinition",
  "TSAbstractMethodDefinition",
  "TSDeclareMethod",
]);

/**
 * @param {AstPath} path
 * @param {*} options
 * @param {*} print
 * @param {*} [args]
 * @returns {Doc}
 */
function print(path, options, print, args) {
  if (path.isRoot) {
    options.__onHtmlBindingRoot?.(path.node, options);
  }

  const { node } = path;

  // Fast path check for ignored nodes first (less common)
  const doc = isIgnored(path)
    ? options.originalText.slice(locStart(node), locEnd(node))
    : printWithoutParentheses(path, options, print, args);

  if (!doc) {
    return "";
  }

  // Fast path: if node should print directly (most common for class members)
  if (shouldPrintDirectly(node)) {
    return doc;
  }

  // Optimize: Check decorators and compute values needed for multiple checks
  const hasDecorators = isNonEmptyArray(node.decorators);

  // Early return for nodes with decorators (except ClassExpression)
  if (hasDecorators && node.type !== "ClassExpression") {
    const decoratorsDoc = printDecorators(path, options, print);
    return inheritLabel(doc, (doc) => group([decoratorsDoc, doc]));
  }

  const needsParens = pathNeedsParens(path, options);
  const needsSemi = shouldPrintLeadingSemicolon(path, options);

  // Fast path: no decorators, parens, or semi needed (most common case)
  if (!hasDecorators && !needsParens && !needsSemi) {
    return doc;
  }

  // Compute decorators doc only if needed
  const decoratorsDoc = hasDecorators ? printDecorators(path, options, print) : "";

  // Handle remaining cases with parens/semi
  return inheritLabel(doc, (doc) => [
    needsSemi ? ";" : "",
    needsParens ? "(" : "",
    needsParens && node.type === "ClassExpression" && hasDecorators
      ? [indent([line, decoratorsDoc, doc]), line]
      : [decoratorsDoc, doc],
    needsParens ? ")" : "",
  ]);
}

export default print;
