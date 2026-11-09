import isNonEmptyArray from "../../utilities/is-non-empty-array.js";
import { hasExplicitOperation } from "../utilities/has-explicit-operation.js";
import { printDescription } from "./description.js";
import { printDirectives } from "./directives.js";
import { printVariableDefinitions } from "./variable-definitions.js";

function printOperationDefinition(path, options, print) {
  const { node } = path;
  const hasOperation = hasExplicitOperation(node, options);
  const hasName = Boolean(node.name);
  return [
    printDescription(path, options, print),
    hasOperation ? node.operation : "",
    hasOperation && hasName ? [" ", print("name")] : "",
    hasOperation && !hasName && isNonEmptyArray(node.variableDefinitions)
      ? " "
      : "",
    printVariableDefinitions(path, print),
    printDirectives(path, print),
    !hasOperation && !hasName ? "" : " ",
    print("selectionSet"),
  ];
}

export { printOperationDefinition };
