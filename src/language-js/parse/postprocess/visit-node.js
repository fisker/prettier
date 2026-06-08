import isObject from "../../../utilities/is-object.js";
import getVisitorKeys from "../../traverse/get-visitor-keys.js";

function visitNode(node, options) {
  if (!isObject(node)) {
    return node;
  }

  if (Array.isArray(node)) {
    // As of Node.js 16 using raw for loop over Array.entries provides a
    // measurable difference in performance. Array.entries returns an iterator
    // of arrays.
    for (let childIndex = 0; childIndex < node.length; childIndex++) {
      node[childIndex] = visitNode(node[childIndex], options);
    }
    return node;
  }

  if (options.onEnter) {
    const result = options.onEnter(node) ?? node;
    // If node is replaced, re-enter
    if (result !== node) {
      return visitNode(result, options);
    }

    node = result;
  }

  const keys = getVisitorKeys(node);
  for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
    node[keys[keyIndex]] = visitNode(node[keys[keyIndex]], options);
  }

  if (options.onLeave) {
    node = options.onLeave(node) || node;
  }

  return node;
}

export default visitNode;
