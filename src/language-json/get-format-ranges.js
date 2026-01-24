/**
 * JSON source elements that can be formatted independently
 */
const jsonSourceElements = new Set([
  "JsonRoot",
  "ObjectExpression",
  "ArrayExpression",
  "StringLiteral",
  "NumericLiteral",
  "BooleanLiteral",
  "NullLiteral",
  "UnaryExpression",
  "TemplateLiteral",
]);

/**
 * Check if a node is a JSON source element
 * @param {object} node - AST node
 * @returns {boolean}
 */
function isJsonSourceElement(node) {
  return jsonSourceElements.has(node.type);
}

/**
 * Find common ancestor between start and end nodes in JSON AST
 * @param {object[]} startNodeAndAncestors - Start node and its ancestors
 * @param {object[]} endNodeAndAncestors - End node and its ancestors
 * @returns {object | undefined} Common ancestor node
 */
function findCommonAncestor(startNodeAndAncestors, endNodeAndAncestors) {
  const endNodeSet = new Set(endNodeAndAncestors);
  return startNodeAndAncestors.find(
    (node) => jsonSourceElements.has(node.type) && endNodeSet.has(node),
  );
}

/**
 * Calculate format ranges for JSON based on AstPath
 * This function is called when formatting a JSON range
 *
 * @param {object} startNodeAndAncestors - Start node and ancestors
 * @param {object} endNodeAndAncestors - End node and ancestors
 * @param {object} ast - The root AST node
 * @yields {[object, object]} Tuple of [startNode, endNode] to format
 */
function* getFormatRanges(startNodeAndAncestors, endNodeAndAncestors, ast) {
  if (ast.type === "JsonRoot") {
    const commonAncestor = findCommonAncestor(
      startNodeAndAncestors,
      endNodeAndAncestors,
    );
    if (commonAncestor) {
      yield [commonAncestor, commonAncestor];
    }
  }
}

export { getFormatRanges, isJsonSourceElement };
