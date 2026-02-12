import { shouldFlatten } from "./should-flatten.js";

function* flatBinaryishExpression(node, selectors = []) {
  for (const property of ["left", "right"]) {
    const child = node[property];
    const childSelectors = [...selectors, property];
    if (
      node.type === child.type &&
      shouldFlatten(node.operator, child.operator)
    ) {
      yield* flatBinaryishExpression(child, childSelectors);
    } else {
      yield childSelectors;
    }
  }
}

export { flatBinaryishExpression };
