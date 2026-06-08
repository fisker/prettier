import { parse as parseV8 } from "postcss-values-parser";
import isObject from "../../utilities/is-object.js";
import getFunctionArgumentsText from "../utilities/get-function-arguments-text.js";
import getValueRoot from "../utilities/get-value-root.js";
import hasSCSSInterpolation from "../utilities/has-scss-interpolation.js";
import hasStringOrFunction from "../utilities/has-string-or-function.js";
import isSCSSVariable from "../utilities/is-scss-variable.js";
import parseSelector from "./parse-selector.js";
import { addTypePrefix } from "./utilities.js";

const isClosingParenthesis = (node) =>
  node.type === "paren" && node.value === ")";

/**
 * Extract a plain source object (without the Input reference) from a v8 node,
 * preserving start/end line and column info for downstream consumers such as
 * the grid-value formatter that checks `node.source.start.line`.
 */
function v8NodeSource(v8Node) {
  if (!v8Node.source) return undefined;
  return {
    start: v8Node.source.start,
    end: v8Node.source.end,
  };
}

/**
 * Extract `/* ... *​/` comments from a CSS value string and replace each with
 * an equal number of spaces so that subsequent token offsets are unaffected.
 * Returns the cleaned string and a sorted list of comment descriptors.
 */
function extractValueComments(value) {
  const comments = [];
  const cleaned = value.replace(/\/\*[\s\S]*?\*\//g, (match, offset) => {
    comments.push({ type: "comment", value: match, sourceIndex: offset });
    return " ".repeat(match.length);
  });
  return { cleaned, comments };
}

/**
 * Normalize postcss-values-parser v8 AST nodes to the v2-compatible format
 * that the rest of the code expects (with `sourceIndex`, `raws.before`, v2
 * type names, etc.).
 *
 * @param {*[]} v8Nodes  - array of v8 PostCSS nodes
 * @param {*}   parent   - parent node to assign to each result node
 * @param {object} [opts]
 * @param {number}  [opts.offsetAdjust=0]  - add to every v8 source offset
 *                                            (used when re-parsing sub-strings)
 * @param {number}  [opts.startOffset]     - initial prevEndOffset
 *                                            (default = offsetAdjust, but
 *                                             func/paren callers set it to
 *                                             the offset just after `(`)
 * @param {string}  [opts.fullCss]         - full original value string used
 *                                            to compute raws.before
 * @param {*[]}     [opts.comments]        - mutable sorted array of pending
 *                                            comment nodes; consumed in place
 * @returns {*[]}
 */
function normalizeV8Nodes(v8Nodes, parent, opts = {}) {
  const {
    offsetAdjust = 0,
    fullCss = null,
    comments = null,
  } = opts;
  const startOffset = opts.startOffset ?? offsetAdjust;

  // Resolve the CSS string used to compute whitespace gaps (raws.before).
  const css = fullCss ?? v8Nodes[0]?.source?.input?.css ?? "";

  const result = [];
  let prevEndOffset = startOffset;

  /** Insert any pending comments whose sourceIndex falls in [prevEnd, upTo). */
  const flushComments = (upTo) => {
    if (!comments) return;
    while (
      comments.length > 0 &&
      comments[0].sourceIndex < upTo &&
      comments[0].sourceIndex >= prevEndOffset
    ) {
      const c = comments.shift();
      result.push({
        type: "comment",
        value: c.value,
        inline: false,
        raws: { before: css.slice(prevEndOffset, c.sourceIndex) },
        source: { start: { offset: c.sourceIndex } },
        sourceIndex: c.sourceIndex,
        parent,
      });
      prevEndOffset = c.sourceIndex + c.value.length;
    }
  };

  for (const v8Node of v8Nodes) {
    const si = (v8Node.source?.start?.offset ?? 0) + offsetAdjust;
    const endOffset =
      (v8Node.source?.end?.offset ??
        v8Node.source?.start?.offset ??
        si - offsetAdjust) + offsetAdjust;

    // Flush comments that precede this token.
    flushComments(si);

    const rawsBefore = css.slice(prevEndOffset, si);

    // ── Handle opaque (empty-value) word nodes from v8 ──────────────────────
    // v8 creates word nodes with value="" when it treats a sub-expression as
    // opaque.  The source span covers the full expression text.
    if (v8Node.type === "word" && si < endOffset) {
      const span = css.slice(si, endOffset);

      // url() detection (v8 maps `url(foo)` to an opaque word).
      if (/^url\s*\(/i.test(span)) {
        const parenIdx = span.indexOf("(");
        const openSi = si + parenIdx;
        const closeSi = endOffset - 1;
        const rawContent = span.slice(parenIdx + 1, -1);
        const trimmedContent = rawContent.trim();
        const leadingSpace =
          rawContent.length - rawContent.trimStart().length;
        const contentSi = openSi + 1 + leadingSpace;

        let contentNode;
        if (trimmedContent[0] === '"' || trimmedContent[0] === "'") {
          const quote = trimmedContent[0];
          contentNode = {
            type: "string",
            value: trimmedContent.slice(1, -1),
            raws: { quote, before: "", after: "" },
            source: { start: { offset: contentSi } },
            sourceIndex: contentSi,
            parent: null,
          };
        } else {
          contentNode = {
            type: "word",
            value: trimmedContent,
            raws: { before: "" },
            source: { start: { offset: contentSi } },
            sourceIndex: contentSi,
            parent: null,
          };
        }

        const func = {
          type: "func",
          value: "url",
          raws: { before: rawsBefore },
          source: v8NodeSource(v8Node),
          sourceIndex: si,
          parent,
        };
        const parenOpen = {
          type: "paren",
          value: "(",
          raws: { before: "" },
          sourceIndex: openSi,
          parent: func,
        };
        const parenClose = {
          type: "paren",
          value: ")",
          raws: { before: "" },
          sourceIndex: closeSi,
          parent: func,
        };
        contentNode.parent = func;
        func.nodes = [parenOpen, contentNode, parenClose];
        result.push(func);
        prevEndOffset = endOffset;
        continue;
      }

      if (v8Node.value === "") {
        if (span.startsWith("[")) {
          // CSS grid line name like `[main-start]` or `[a b]`.
          result.push({
            type: "word",
            value: span,
            raws: { before: rawsBefore },
            source: v8NodeSource(v8Node),
            sourceIndex: si,
            parent,
          });
        } else {
          // Opaque fallback (e.g. var() second argument).  Try to re-parse.
          let pushed = false;
          try {
            const subResult = parseV8(span);
            const subNodes = normalizeV8Nodes(subResult.nodes, parent, {
              offsetAdjust: si,
              startOffset: si,
              fullCss: css,
              comments,
            });
            result.push(...subNodes);
            pushed = true;
          } catch {
            // fall through to single-word fallback below
          }
          if (!pushed) {
            result.push({
              type: "word",
              value: span,
              raws: { before: rawsBefore },
              source: v8NodeSource(v8Node),
              sourceIndex: si,
              parent,
            });
          }
        }
        prevEndOffset = endOffset;
        continue;
      }
    }

    switch (v8Node.type) {
      case "func": {
        const openSi = si + v8Node.name.length;
        const closeSi = endOffset - 1;
        const func = {
          type: "func",
          value: v8Node.name,
          raws: { before: rawsBefore },
          source: v8NodeSource(v8Node),
          sourceIndex: si,
          parent,
        };
        const parenOpen = {
          type: "paren",
          value: "(",
          raws: { before: "" },
          sourceIndex: openSi,
          parent: func,
        };
        const parenClose = {
          type: "paren",
          value: ")",
          raws: { before: "" },
          sourceIndex: closeSi,
          parent: func,
        };
        const children = normalizeV8Nodes(v8Node.nodes ?? [], func, {
          startOffset: openSi + 1,
          fullCss: css,
          comments,
        });
        func.nodes = [parenOpen, ...children, parenClose];
        result.push(func);
        break;
      }
      case "parentheses": {
        const closeSi = endOffset - 1;
        result.push({
          type: "paren",
          value: "(",
          raws: { before: rawsBefore },
          sourceIndex: si,
          parent,
        });
        result.push(
          ...normalizeV8Nodes(v8Node.nodes ?? [], parent, {
            startOffset: si + 1,
            fullCss: css,
            comments,
          }),
        );
        result.push({
          type: "paren",
          value: ")",
          raws: { before: "" },
          sourceIndex: closeSi,
          parent,
        });
        break;
      }
      case "numeric": {
        // v8 includes the % sign in value for percentages; strip it to match v2
        const value =
          v8Node.unit === "%" ? v8Node.value.slice(0, -1) : v8Node.value;
        result.push({
          type: "number",
          value,
          unit: v8Node.unit,
          raws: { before: rawsBefore },
          source: v8NodeSource(v8Node),
          sourceIndex: si,
          parent,
        });
        break;
      }
      case "quoted": {
        // v8 includes the surrounding quotes in value; strip them to match v2
        const quote = v8Node.value[0]; // " or '
        result.push({
          type: "string",
          value: v8Node.value.slice(1, -1),
          raws: { quote, before: rawsBefore, after: "" },
          source: v8NodeSource(v8Node),
          sourceIndex: si,
          parent,
        });
        break;
      }
      case "operator": {
        const trimmed = v8Node.value.trim();
        if (trimmed === ",") {
          result.push({
            type: "comma",
            value: ",",
            raws: { before: rawsBefore },
            source: v8NodeSource(v8Node),
            sourceIndex: si,
            parent,
          });
        } else if (trimmed === ":") {
          result.push({
            type: "colon",
            value: ":",
            raws: { before: rawsBefore },
            source: v8NodeSource(v8Node),
            sourceIndex: si,
            parent,
          });
        } else {
          // v8 may include surrounding whitespace in operator values; trim it
          result.push({
            type: "operator",
            value: trimmed,
            raws: { before: rawsBefore },
            source: v8NodeSource(v8Node),
            sourceIndex: si,
            parent,
          });
        }
        break;
      }
      case "unicodeRange": {
        result.push({
          type: "unicode-range",
          value: v8Node.value,
          raws: { before: rawsBefore },
          source: v8NodeSource(v8Node),
          sourceIndex: si,
          parent,
        });
        break;
      }
      case "word": {
        result.push({
          type: "word",
          value: v8Node.value,
          isColor: v8Node.isColor,
          isHex: v8Node.isHex,
          isUrl: v8Node.isUrl,
          isVariable: v8Node.isVariable,
          raws: { before: rawsBefore },
          source: v8NodeSource(v8Node),
          sourceIndex: si,
          parent,
        });
        break;
      }
      default: {
        // Pass through unknown types with sourceIndex
        result.push({
          type: v8Node.type,
          value: v8Node.value ?? "",
          raws: { before: rawsBefore },
          source: v8NodeSource(v8Node),
          sourceIndex: si,
          parent,
        });
        break;
      }
    }

    prevEndOffset = endOffset;
  }

  // Flush any trailing comments (after the last token).
  if (comments) {
    while (comments.length > 0) {
      const c = comments[0];
      if (c.sourceIndex < prevEndOffset) {
        comments.shift();
        continue;
      }
      comments.shift();
      result.push({
        type: "comment",
        value: c.value,
        inline: false,
        raws: { before: css.slice(prevEndOffset, c.sourceIndex) },
        source: { start: { offset: c.sourceIndex } },
        sourceIndex: c.sourceIndex,
        parent,
      });
      prevEndOffset = c.sourceIndex + c.value.length;
    }
  }

  return result;
}

/**
 * Wrap a v8 parse result in a v2-compatible root+value structure so that the
 * existing `parseNestedValue` / `addTypePrefix` pipeline works unchanged.
 */
function normalizeV8Result(v8Root, text, comments) {
  const normalizedRoot = { type: "root", text };
  const valueWrapper = {
    type: "value",
    sourceIndex: 0,
    parent: normalizedRoot,
  };
  valueWrapper.nodes = normalizeV8Nodes(v8Root.nodes ?? [], valueWrapper, {
    startOffset: 0,
    fullCss: text,
    comments,
  });
  normalizedRoot.nodes = [valueWrapper];
  return normalizedRoot;
}

function parseValueNode(valueNode, options) {
  const { nodes } = valueNode;
  let parenGroup = {
    open: null,
    close: null,
    groups: [],
    type: "paren_group",
  };
  const parenGroupStack = [parenGroup];
  const rootParenGroup = parenGroup;
  let commaGroup = {
    groups: [],
    type: "comma_group",
  };
  const commaGroupStack = [commaGroup];

  for (let i = 0; i < nodes.length; ++i) {
    const node = nodes[i];

    if (
      options.parser === "scss" &&
      node.type === "number" &&
      node.unit === ".." &&
      node.value.endsWith(".")
    ) {
      // Work around postcss bug parsing `50...` as `50.` with unit `..`
      // Set the unit to `...` to "accidentally" have arbitrary arguments work in the same way that cases where the node already had a unit work.
      // For example, 50px... is parsed as `50` with unit `px...` already by postcss-values-parser.
      node.value = node.value.slice(0, -1);
      node.unit = "...";
    }

    if (node.type === "func" && node.value === "selector") {
      const selector = getValueRoot(valueNode).text.slice(
        node.group.open.sourceIndex + 1,
        node.group.close.sourceIndex,
      );
      const parsedSelector = parseSelector(selector);
      parsedSelector.sourceIndex = node.group.open.sourceIndex + 1;
      parsedSelector.raws ??= {};
      parsedSelector.raws.selector = selector;
      node.group.groups = [parsedSelector];
    }

    if (node.type === "func" && node.value === "url") {
      const groups = node.group?.groups ?? [];

      // Create a view with any top-level comma groups flattened.
      let groupList = [];
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        if (group.type === "comma_group") {
          groupList = [...groupList, ...group.groups];
        } else {
          groupList.push(group);
        }
      }

      // Stringify if the value parser can't handle the content.
      if (
        hasSCSSInterpolation(groupList) ||
        (!hasStringOrFunction(groupList) &&
          !isSCSSVariable(groupList[0], options))
      ) {
        node.group.groups = [getFunctionArgumentsText(node)];
      }
    }
    if (node.type === "paren" && node.value === "(") {
      parenGroup = {
        open: node,
        close: null,
        groups: [],
        type: "paren_group",
      };
      parenGroupStack.push(parenGroup);

      commaGroup = {
        groups: [],
        type: "comma_group",
      };
      commaGroupStack.push(commaGroup);
    } else if (isClosingParenthesis(node)) {
      if (commaGroup.groups.length > 0) {
        parenGroup.groups.push(commaGroup);
      }
      parenGroup.close = node;

      /* c8 ignore next 3 */
      if (commaGroupStack.length === 1) {
        throw new Error("Unbalanced parenthesis");
      }

      commaGroupStack.pop();
      commaGroup = commaGroupStack.at(-1);
      commaGroup.groups.push(parenGroup);

      parenGroupStack.pop();
      parenGroup = parenGroupStack.at(-1);
    } else if (node.type === "comma") {
      // Trialing comma
      if (
        i === nodes.length - 3 &&
        nodes[i + 1].type === "comment" &&
        isClosingParenthesis(nodes[i + 2])
      ) {
        continue;
      }

      parenGroup.groups.push(commaGroup);
      commaGroup = {
        groups: [],
        type: "comma_group",
      };
      commaGroupStack[commaGroupStack.length - 1] = commaGroup;
    } else {
      commaGroup.groups.push(node);
    }
  }
  if (commaGroup.groups.length > 0) {
    parenGroup.groups.push(commaGroup);
  }

  return rootParenGroup;
}

function flattenGroups(node) {
  if (
    node.type === "paren_group" &&
    !node.open &&
    !node.close &&
    node.groups.length === 1
  ) {
    return flattenGroups(node.groups[0]);
  }

  if (node.type === "comma_group" && node.groups.length === 1) {
    return flattenGroups(node.groups[0]);
  }

  if (node.type === "paren_group" || node.type === "comma_group") {
    return { ...node, groups: node.groups.map(flattenGroups) };
  }

  return node;
}

function parseNestedValue(node, options) {
  if (isObject(node)) {
    for (const key in node) {
      if (key !== "parent") {
        parseNestedValue(node[key], options);
        if (key === "nodes") {
          if (!(node.type === "atword" && node.nodes.length === 0)) {
            node.group = flattenGroups(parseValueNode(node, options));
          }
          delete node[key];
        }
      }
    }
  }
  return node;
}

function parseValue(value, options) {
  // Inline javascript in Less
  if (options.parser === "less" && value.startsWith("~`")) {
    return { type: "value-unknown", value };
  }

  let result;

  try {
    const { cleaned, comments } = extractValueComments(value);
    result = normalizeV8Result(parseV8(cleaned), value, comments);
  } catch {
    return {
      type: "value-unknown",
      value,
    };
  }

  const parsedResult = parseNestedValue(result, options);

  return addTypePrefix(parsedResult, "value-", /^selector-/);
}

export default parseValue;
