import { getOrInsertComputed } from "../../utilities/get-or-insert.js";
import { locStart } from "../loc.js";

const operationCheckCache = new WeakMap();
const hasExplicitOperation = (node, options) =>
  getOrInsertComputed(
    operationCheckCache,
    node,
    (node) => options.originalText[locStart(node)] !== "{",
  );

export { hasExplicitOperation };
