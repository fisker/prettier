import { hardline, indent, line } from "../../document/index.js";
import { printDanglingComments } from "../../main/comments/print.js";
import hasNewline from "../../utils/has-newline.js";
import { locEnd } from "../loc.js";
import {
  CommentCheckFlags,
  createTypeCheckFunction,
  getComments,
  hasComment,
  isCallExpression,
  isMemberExpression,
} from "../utils/index.js";
import { printTypeAnnotationProperty } from "./type-annotation.js";

/**
 * @import AstPath from "../../common/ast-path.js"
 * @import {Doc} from "../../document/index.js"
 */

/**
 * @param {AstPath} path
 * @returns {Doc}
 */
function printOptionalToken(path) {
  const { node } = path;
  if (
    !node.optional ||
    // It's an optional computed method parsed by typescript-estree.
    // "?" is printed in `printMethod`.
    (node.type === "Identifier" && node === path.parent.key)
  ) {
    return "";
  }
  if (
    isCallExpression(node) ||
    (isMemberExpression(node) && node.computed) ||
    node.type === "OptionalIndexedAccessType"
  ) {
    return "?.";
  }
  return "?";
}

/**
 * @param {AstPath} path
 * @returns {Doc}
 */
function printDefiniteToken(path) {
  return path.node.definite ||
    path.match(
      undefined,
      (node, name) =>
        name === "id" && node.type === "VariableDeclarator" && node.definite,
    )
    ? "!"
    : "";
}

const isFlowDeclareNode = createTypeCheckFunction([
  "DeclareClass",
  "DeclareComponent",
  "DeclareFunction",
  "DeclareHook",
  "DeclareVariable",
  "DeclareExportDeclaration",
  "DeclareExportAllDeclaration",
  "DeclareOpaqueType",
  "DeclareTypeAlias",
  "DeclareEnum",
  "DeclareInterface",
]);

/**
 * @param {AstPath} path
 * @returns {Doc}
 */
function printDeclareToken(path) {
  const { node } = path;

  return (
    // TypeScript
    node.declare ||
      // Flow
      (isFlowDeclareNode(node) &&
        path.parent.type !== "DeclareExportDeclaration")
      ? "declare "
      : ""
  );
}

const isTsAbstractNode = createTypeCheckFunction([
  "TSAbstractMethodDefinition",
  "TSAbstractPropertyDefinition",
  "TSAbstractAccessorProperty",
]);

/**
 * @param {AstPath} param0
 * @returns {Doc}
 */
function printAbstractToken({ node }) {
  return node.abstract || isTsAbstractNode(node) ? "abstract " : "";
}

function printBindExpressionCallee(path, options, print) {
  return ["::", print("callee")];
}

function adjustClause(node, clause, forceSpace) {
  if (node.type === "EmptyStatement") {
    return hasComment(node, CommentCheckFlags.Leading) ? [" ", clause] : clause;
  }

  if (node.type === "BlockStatement" || forceSpace) {
    return [" ", clause];
  }

  return indent([line, clause]);
}

function printRestSpread(path, print) {
  return ["...", print("argument"), printTypeAnnotationProperty(path, print)];
}

function printTypeScriptAccessibilityToken(node) {
  return node.accessibility ? node.accessibility + " " : "";
}

/**
 * Print "..." for inexact objects or unknown enum members with proper spacing and comments
 * @param {AstPath} path
 * @param {*} options
 * @returns {Doc[]}
 */
function printInexactSpread(path, options) {
  const { node } = path;
  const hasDanglingComments = hasComment(node, CommentCheckFlags.Dangling);

  if (!hasDanglingComments) {
    return ["..."];
  }

  const hasLineComments = hasComment(node, CommentCheckFlags.Line);
  const printedDanglingComments = printDanglingComments(path, options);
  const spacing =
    hasLineComments ||
    hasNewline(options.originalText, locEnd(getComments(node).at(-1)))
      ? hardline
      : line;

  return [printedDanglingComments, spacing, "..."];
}

export {
  adjustClause,
  printAbstractToken,
  printBindExpressionCallee,
  printDeclareToken,
  printDefiniteToken,
  printInexactSpread,
  printOptionalToken,
  printRestSpread,
  printTypeScriptAccessibilityToken,
};
