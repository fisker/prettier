import { estree as estreeBase } from "../language-js/printers.js";
import { getFormatRanges } from "./get-format-ranges.js";
import getVisitorKeys from "./get-visitor-keys.js";
import { massageAstNode } from "./massage-ast/index.js";
import { printJson } from "./print/index.js";

const estreeJsonPrinter = {
  features: {
    experimental_getRangeNodes: getFormatRanges,
  },
  massageAstNode,
  print: printJson,
  getVisitorKeys,
};

// Wrap the estree printer to add JSON-specific range handling feature
const estree = {
  ...estreeBase,
  features: {
    ...estreeBase.features,
    experimental_getRangeNodes: getFormatRanges,
  },
};

export { estree,estreeJsonPrinter as "estree-json" };
