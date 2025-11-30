/**
 * Error thrown when encountering an unexpected AST node type.
 * @class
 */
class UnexpectedNodeError extends Error {
  name = "UnexpectedNodeError";

  /**
   * @param {any} node - The unexpected AST node
   * @param {string} language - The language being parsed
   * @param {string} [typeProperty="type"] - The property name that contains the node type
   */
  constructor(node, language, typeProperty = "type") {
    super(
      `Unexpected ${language} node ${typeProperty}: ${JSON.stringify(
        node[typeProperty],
      )}.`,
    );
    this.node = node;
  }
}

export default UnexpectedNodeError;
