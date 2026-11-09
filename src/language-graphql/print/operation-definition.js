import isNonEmptyArray from "../../utilities/is-non-empty-array.js";
import { locStart } from "../loc.js";
import { printVariableDefinitions } from "./ariable-definitions.js";
import { printDescription } from "./description.js";
import { printDirectives } from "./directives.js";

function printOperationDefinition(path, options, print) {
  const { node } = path;
  const hasOperation = options.originalText[locStart(node)] !== "{";
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
