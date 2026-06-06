import { parse as parsePostcssValue } from "postcss-values-parser";
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

function getSourceIndex(node) {
  return node.source?.start?.offset ?? node.sourceIndex;
}

function createParenNode(value, sourceIndex) {
  return {
    sourceIndex,
    type: "paren",
    value,
  };
}

function getRawNodeText(node, text) {
  const start = getSourceIndex(node);
  const end = node.source?.end?.offset;

  if (typeof start === "number" && typeof end === "number") {
    return text.slice(start, end);
  }
}

function normalizeValueAstNode(node, text) {
  const sourceIndex = getSourceIndex(node);
  const rawValue = getRawNodeText(node, text);

  switch (node.type) {
    case "numeric": {
      let value = node.value;
      if (node.unit === "%" && value.endsWith("%")) {
        value = value.slice(0, -1);
      }

      return [{ ...node, sourceIndex, type: "number", value }];
    }
 
    case "quoted":
      return [
        {
          ...node,
          quoted: true,
          raws: {
            ...(node.raws ?? {}),
            quote: node.quote ?? rawValue?.at(0) ?? node.value?.at(0),
          },
          sourceIndex,
          type: "string",
          value:
            rawValue?.slice(1, -1) ??
            node.value.slice(1, -1) ??
            node.contents ??
            node.value,
        },
      ];

    case "operator":
      return [
        {
          ...node,
          sourceIndex,
          type:
            node.value === ","
              ? "comma"
              : node.value === ":"
                ? "colon"
                : "operator",
        },
      ];

    case "punctuation":
      return [
        {
          ...node,
          sourceIndex,
          type:
            node.value === ","
              ? "comma"
              : node.value === ":"
                ? "colon"
                : "operator",
        },
      ];

    case "unicodeRange":
      return [{ ...node, sourceIndex, type: "unicode-range" }];

    case "func": {
      const startOffset = sourceIndex ?? 0;
      const endOffset =
        node.source?.end?.offset ?? startOffset + (rawValue ?? "").length;
      return [
        {
          ...node,
          sourceIndex,
          type: "func",
          value: node.name,
          nodes: [
            createParenNode("(", startOffset + node.name.length),
            ...normalizeValueAstNodes(node.nodes, text),
            createParenNode(")", endOffset - 1),
          ],
        },
      ];
    }

    case "parentheses": {
      const startOffset = sourceIndex ?? 0;
      const endOffset =
        node.source?.end?.offset ?? startOffset + (rawValue ?? "").length;
      return [
        createParenNode("(", startOffset),
        ...normalizeValueAstNodes(node.nodes, text),
        createParenNode(")", endOffset - 1),
      ];
    }

    case "word":
      if (
        rawValue &&
        rawValue.length > 5 &&
        rawValue.toLowerCase().startsWith("url(") &&
        rawValue.endsWith(")")
      ) {
        const startOffset = sourceIndex ?? 0;
        const endOffset =
          node.source?.end?.offset ?? startOffset + rawValue.length;
        const insideText = rawValue.slice(4, -1);

        return [
          {
            ...node,
            sourceIndex,
            type: "func",
            value: "url",
            nodes: [
              createParenNode("(", startOffset + 3),
              ...(insideText
                ? [{ sourceIndex: startOffset + 4, type: "word", value: insideText }]
                : []),
              createParenNode(")", endOffset - 1),
            ],
          },
        ];
      }
      return [{ ...node, sourceIndex }];

    default:
      return [{ ...node, sourceIndex }];
  }
}

function normalizeValueAstNodes(nodes = [], text) {
  return nodes.flatMap((node) => normalizeValueAstNode(node, text));
}

function normalizeValueAst(ast, text) {
  const sourceIndex = getSourceIndex(ast);

  const normalized = {
    ...ast,
    sourceIndex,
    type: "root",
    nodes: [
      {
        sourceIndex,
        type: "value",
        nodes: normalizeValueAstNodes(ast.nodes, text),
      },
    ],
  };

  setParent(normalized);

  return normalized;
}

function setParent(node, parent = undefined) {
  if (!isObject(node)) {
    return;
  }

  if (parent) {
    node.parent = parent;
  } else {
    delete node.parent;
  }

  for (const key in node) {
    if (key === "parent") {
      continue;
    }

    const value = node[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        setParent(child, node);
      }
    } else if (isObject(value)) {
      setParent(value, node);
    }
  }
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
    result = normalizeValueAst(parsePostcssValue(value, { loose: true }), value);
  } catch {
    return {
      type: "value-unknown",
      value,
    };
  }

  result.text = value;

  const parsedResult = parseNestedValue(result, options);

  return addTypePrefix(parsedResult, "value-", /^selector-/);
}

export default parseValue;
