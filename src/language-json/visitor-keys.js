/**
 * Visitor keys mapping for JSON AST nodes.
 * Each key represents a node type, and the value is an array of property names
 * that should be visited when traversing the AST.
 * @type {Record<string, string[]>}
 */
const visitorKeys = {
  JsonRoot: ["node"],
  ArrayExpression: ["elements"],
  ObjectExpression: ["properties"],
  ObjectProperty: ["key", "value"],
  UnaryExpression: ["argument"],
  NullLiteral: [],
  BooleanLiteral: [],
  StringLiteral: [],
  NumericLiteral: [],
  Identifier: [],
  TemplateLiteral: ["quasis"],
  TemplateElement: [],
};

export default visitorKeys;
