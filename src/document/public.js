import * as docBuilders from "./builders.js";
import { printDocToString } from "./printer.js";
import {
  getDocParts,
  willBreak,
  traverseDoc,
  findInDoc,
  mapDoc,
  propagateBreaks,
  removeLines,
  stripTrailingHardline,
  replaceEndOfLine,
  canBreak,
  getDocType,
} from "./utils.js";

export const builders = {
  ...docBuilders,
  // TODO: Remove this in v4
  concat: (parts) => parts,
};
export const printer = {
  printDocToString,
};
export const utils = {
  getDocParts,
  willBreak,
  traverseDoc,
  findInDoc,
  mapDoc,
  propagateBreaks,
  removeLines,
  stripTrailingHardline,
  replaceEndOfLine,
  canBreak,
  getDocType,
};
export * as debug from "./debug.js";
