import {
  group,
  ifBreak,
  indent,
  line,
  softline,
} from "../../document/builders.js";
import { printDanglingComments } from "../../main/comments/print.js";
import hasNewlineInRange from "../../utils/has-newline-in-range.js";
import { locStart } from "../loc.js";

/**
 * @param {string | null} optional
 * @returns {string}
 */
function printFlowMappedTypeOptionalModifier(optional) {
  switch (optional) {
    case null:
      return "";
    case "PlusOptional":
      return "+?";
    case "MinusOptional":
      return "-?";
    case "Optional":
      return "?";
  }
}

function printFlowMappedTypeProperty(path, options, print) {
  const { node } = path;
  return group([
    node.variance ? print("variance") : "",
    "[",
    indent([print("keyTparam"), " in ", print("sourceType")]),
    "]",
    printFlowMappedTypeOptionalModifier(node.optional),
    ": ",
    print("propType"),
  ]);
}

/**
 * @param {string} tokenNode
 * @param {string} keyword
 * @returns {string}
 */
function printTypeScriptMappedTypeModifier(tokenNode, keyword) {
  if (tokenNode === "+" || tokenNode === "-") {
    return tokenNode + keyword;
  }

  return keyword;
}

function printTypescriptMappedType(path, options, print) {
  const { node } = path;
  // Break after `{` like `printObject`
  const shouldBreak = hasNewlineInRange(
    options.originalText,
    locStart(node),
    // Ideally, this should be the next token after `{`, but there is no node starts with it.
    locStart(node.key),
  );

  return group(
    [
      "{",
      indent([
        options.bracketSpacing ? line : softline,
        group([
          node.readonly
            ? printTypeScriptMappedTypeModifier(node.readonly, "readonly ")
            : "",
          "[",
          print("key"),
          node.constraint ? [" in ", print("constraint")] : "",
          node.nameType ? [" as ", print("nameType")] : "",
          "]",
          node.optional
            ? printTypeScriptMappedTypeModifier(node.optional, "?")
            : "",
          node.typeAnnotation ? ": " : "",
          print("typeAnnotation"),
        ]),
        options.semi ? ifBreak(";") : "",
      ]),
      printDanglingComments(path, options),
      options.bracketSpacing ? line : softline,
      "}",
    ],
    { shouldBreak },
  );
}

export { printFlowMappedTypeProperty, printTypescriptMappedType };
