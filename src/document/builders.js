import {
  DOC_TYPE_CURSOR,
  DOC_TYPE_INDENT,
  DOC_TYPE_ALIGN,
  DOC_TYPE_TRIM,
  DOC_TYPE_GROUP,
  DOC_TYPE_FILL,
  DOC_TYPE_IF_BREAK,
  DOC_TYPE_INDENT_IF_BREAK,
  DOC_TYPE_LINE_SUFFIX,
  DOC_TYPE_LINE_SUFFIX_BOUNDARY,
  DOC_TYPE_LINE,
  DOC_TYPE_LABEL,
  DOC_TYPE_BREAK_PARENT,
} from "./constants.js";
import { assertDoc, assertDocArray } from "./utils/assert-doc.js";

/**
 * @typedef {string | number | {type: "root"}} DocAlignType
 * @typedef {string | symbol} DocGroupId
 *
 * @typedef {{type: DOC_TYPE_CURSOR}} DocCursor
 * @typedef {{type: DOC_TYPE_INDENT, contents: Doc}} DocIndent
 * @typedef {{type: DOC_TYPE_ALIGN, contents: Doc, n: DocAlignType}} DocAlign
 * @typedef {{type: DOC_TYPE_TRIM}} DocTrim
 * @typedef {{type: DOC_TYPE_GROUP, id: DocGroupId, contents: Doc, break: Boolean, expandedStates: Doc[]}} DocGroup
 * @typedef {{type: DOC_TYPE_FILL, parts: Doc[]}} DocFill
 * @typedef {{type: DOC_TYPE_IF_BREAK, breakContents: Doc, flatContents: Doc, groupId: DocGroupId}} DocIfBreak
 * @typedef {{type: DOC_TYPE_INDENT_IF_BREAK, contents: Doc, groupId: DocGroupId, negate: boolean}} DocIndentIfBreak
 * @typedef {{type: DOC_TYPE_LINE_SUFFIX, contents: Doc}} DocLineSuffix
 * @typedef {{type: DOC_TYPE_LINE_SUFFIX_BOUNDARY}} DocLineSuffixBoundary
 * @typedef {{type: DOC_TYPE_LINE, hard?: boolean, soft?: boolean, literal?: boolean}} DocLine
 * @typedef {{type: DOC_TYPE_LABEL, label: any, contents: Doc}} DocLabel
 * @typedef {{type: DOC_TYPE_BREAK_PARENT}} DocBreakParent
 *
 * @typedef {(
 *  | DocCursor
 *  | DocIndent
 *  | DocAlign
 *  | DocTrim
 *  | DocGroup
 *  | DocFill
 *  | DocIfBreak
 *  | DocIndentIfBreak
 *  | DocLineSuffix
 *  | DocLineSuffixBoundary
 *  | DocLine
 *  | DocLabel
 *  | DocBreakParent
 * )} DocObject
 *
 * @typedef {Doc[]} DocArray
 *
 * @typedef {string | DocObject | DocArray} Doc
 *
 * @typedef {import("./constants.js").ObjectDocTypes} ObjectDocTypes
 */

/**
 * @param {Doc} contents
 * @returns {DocIndent}
 */
function indent(contents) {
  assertDoc(contents);

  return { type: DOC_TYPE_INDENT, contents };
}

/**
 * @param {DocAlignType} widthOrString
 * @param {Doc} contents
 * @returns {DocAlign}
 */
function align(widthOrString, contents) {
  assertDoc(contents);

  return { type: DOC_TYPE_ALIGN, contents, n: widthOrString };
}

/**
 * @param {Doc} contents
 * @param {object} [opts] - TBD ???
 * @returns {DocGroup}
 */
function group(contents, opts = {}) {
  assertDoc(contents);
  assertDocArray(opts.expandedStates, /* optional */ true);

  return {
    type: DOC_TYPE_GROUP,
    id: opts.id,
    contents,
    break: Boolean(opts.shouldBreak),
    expandedStates: opts.expandedStates,
  };
}

/**
 * @param {Doc} contents
 * @returns {DocAlign}
 */
function dedentToRoot(contents) {
  return align(Number.NEGATIVE_INFINITY, contents);
}

/**
 * @param {Doc} contents
 * @returns {DocAlign}
 */
function markAsRoot(contents) {
  return align({ type: "root" }, contents);
}

/**
 * @param {Doc} contents
 * @returns {DocAlign}
 */
function dedent(contents) {
  return align(-1, contents);
}

/**
 * @param {Doc[]} states
 * @param {object} [opts] - TBD ???
 * @returns {DocGroup}
 */
function conditionalGroup(states, opts) {
  return group(states[0], { ...opts, expandedStates: states });
}

/**
 * @param {Doc[]} parts
 * @returns {DocFill}
 */
function fill(parts) {
  assertDocArray(parts);

  return { type: DOC_TYPE_FILL, parts };
}

/**
 * @param {Doc} breakContents
 * @param {Doc} [flatContents]
 * @param {object} [opts] - TBD ???
 * @returns {DocIfBreak}
 */
function ifBreak(breakContents, flatContents = "", opts = {}) {
  assertDoc(breakContents);
  if (flatContents !== "") {
    assertDoc(flatContents);
  }

  return {
    type: DOC_TYPE_IF_BREAK,
    breakContents,
    flatContents,
    groupId: opts.groupId,
  };
}

/**
 * Optimized version of `ifBreak(indent(doc), doc, { groupId: ... })`
 * @param {Doc} contents
 * @param {{ groupId: symbol, negate?: boolean }} opts
 * @returns {DocIndentIfBreak}
 */
function indentIfBreak(contents, opts) {
  assertDoc(contents);

  return {
    type: DOC_TYPE_INDENT_IF_BREAK,
    contents,
    groupId: opts.groupId,
    negate: opts.negate,
  };
}

/**
 * @param {Doc} contents
 * @returns {DocLineSuffix}
 */
function lineSuffix(contents) {
  assertDoc(contents);

  return { type: DOC_TYPE_LINE_SUFFIX, contents };
}

/** @type {DocLineSuffixBoundary}  */
const lineSuffixBoundary = { type: DOC_TYPE_LINE_SUFFIX_BOUNDARY };
/** @type {DocBreakParent}  */
const breakParent = { type: DOC_TYPE_BREAK_PARENT };
/** @type {DocTrim} */
const trim = { type: DOC_TYPE_TRIM };

/** @type {DocLine} */
const hardlineWithoutBreakParent = { type: DOC_TYPE_LINE, hard: true };
/** @type {DocLine} */
const literallineWithoutBreakParent = {
  type: DOC_TYPE_LINE,
  hard: true,
  literal: true,
};
/** @type {DocLine} */
const line = { type: DOC_TYPE_LINE };
/** @type {DocLine} */
const softline = { type: DOC_TYPE_LINE, soft: true };
const hardline = [hardlineWithoutBreakParent, breakParent];
const literalline = [literallineWithoutBreakParent, breakParent];

/** @type {DocCursor} */
const cursor = { type: DOC_TYPE_CURSOR };

/**
 * @param {Doc} separator
 * @param {Doc[]} docs
 * @returns {Doc[]}
 */
function join(separator, docs) {
  assertDoc(separator);
  assertDocArray(docs);

  const parts = [];

  for (let i = 0; i < docs.length; i++) {
    if (i !== 0) {
      parts.push(separator);
    }

    parts.push(docs[i]);
  }

  return parts;
}

/**
 * @param {Doc} doc
 * @param {number} size
 * @param {number} tabWidth
 * @returns {Doc}
 */
function addAlignmentToDoc(doc, size, tabWidth) {
  assertDoc(doc);

  let aligned = doc;
  if (size > 0) {
    // Use indent to add tabs for all the levels of tabs we need
    for (let i = 0; i < Math.floor(size / tabWidth); ++i) {
      aligned = indent(aligned);
    }
    // Use align for all the spaces that are needed
    aligned = align(size % tabWidth, aligned);
    // size is absolute from 0 and not relative to the current
    // indentation, so we use -Infinity to reset the indentation to 0
    aligned = align(Number.NEGATIVE_INFINITY, aligned);
  }
  return aligned;
}

/**
 * Mark a doc with an arbitrary truthy value. This doesn't affect how the doc is printed, but can be useful for heuristics based on doc introspection.
 * @template {Doc} T
 * @param {any} label If falsy, the `contents` doc is returned as is.
 * @param {T} contents
 * @returns {DocLabel | T}
 */
function label(label, contents) {
  assertDoc(contents);

  return label ? { type: DOC_TYPE_LABEL, label, contents } : contents;
}

export {
  join,
  line,
  softline,
  hardline,
  literalline,
  group,
  conditionalGroup,
  fill,
  lineSuffix,
  lineSuffixBoundary,
  cursor,
  breakParent,
  ifBreak,
  trim,
  indent,
  indentIfBreak,
  align,
  addAlignmentToDoc,
  markAsRoot,
  dedentToRoot,
  dedent,
  hardlineWithoutBreakParent,
  literallineWithoutBreakParent,
  label,
};
