"use strict";

const createError = require("../common/parser-create-error");
const { hasPragma } = require("./pragma");
const locFns = require("./loc");
const postprocess = require("./postprocess");
const {
  normalizePlugin,
  commonPlugins,
  jsxPlugin,
  filterPlugins,
} = require("./babel-plugins");

function babelOptions({ plugins = [], extraPlugins = [] }) {
  return {
    sourceType: "module",
    allowAwaitOutsideFunction: true,
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    allowSuperOutsideMethod: true,
    allowUndeclaredExports: true,
    errorRecovery: true,
    createParenthesizedExpressions: true,
    plugins: [...plugins, ...extraPlugins],
  };
}

function resolvePluginsConflict(
  condition,
  pluginCombinations,
  conflictPlugins
) {
  if (!condition) {
    return pluginCombinations;
  }
  const combinations = [];
  for (const combination of pluginCombinations) {
    for (const plugin of conflictPlugins) {
      combinations.push([...combination, plugin]);
    }
  }
  return combinations;
}

function createParse(parseMethod, ...pluginCombinations) {
  return (text, parsers, opts) => {
    // Inline the require to avoid loading all the JS if we don't use it
    const babel = require("@babel/parser");
    const plugins = filterPlugins(commonPlugins, text);

    let ast;
    try {
      const combinations = resolvePluginsConflict(
        text.includes("|>"),
        pluginCombinations.map((plugins) =>
          filterPlugins(plugins.map(normalizePlugin), text)
        ),
        [
          ["pipelineOperator", { proposal: "smart" }],
          ["pipelineOperator", { proposal: "minimal" }],
          ["pipelineOperator", { proposal: "fsharp" }],
        ]
      );
      ast = tryCombinations(
        (options) => babel[parseMethod](text, options),
        combinations.map((extraPlugins) =>
          babelOptions({ plugins, extraPlugins })
        )
      );
    } catch (error) {
      throw createError(
        // babel error prints (l:c) with cols that are zero indexed
        // so we need our custom error
        error.message.replace(/ \(.*\)/, ""),
        {
          start: {
            line: error.loc.line,
            column: error.loc.column + 1,
          },
        }
      );
    }
    delete ast.tokens;
    return postprocess(ast, { ...opts, originalText: text });
  };
}

const parse = createParse("parse", [
  jsxPlugin,
  {
    name: "flow",
    test: (text) => text.includes("@flow"),
  },
]);
const parseFlow = createParse("parse", [
  jsxPlugin,
  {
    name: "flow",
    options: { all: true, enums: true },
  },
]);
const parseTypeScript = createParse(
  "parse",
  [
    jsxPlugin,
    {
      name: "typescript",
    },
  ],
  [
    {
      name: "typescript",
    },
  ]
);
const parseExpression = createParse("parseExpression", [jsxPlugin]);

function tryCombinations(fn, combinations) {
  let error;
  for (let i = 0; i < combinations.length; i++) {
    try {
      return fn(combinations[i]);
    } catch (_error) {
      if (!error) {
        error = _error;
      }
    }
  }
  throw error;
}

function parseJson(text, parsers, opts) {
  const ast = parseExpression(text, parsers, opts);

  ast.comments.forEach(assertJsonNode);
  assertJsonNode(ast);

  return ast;
}

function assertJsonNode(node, parent) {
  switch (node.type) {
    case "ArrayExpression":
      return node.elements.forEach(assertJsonChildNode);
    case "ObjectExpression":
      return node.properties.forEach(assertJsonChildNode);
    case "ObjectProperty":
      if (node.computed) {
        throw createJsonError("computed");
      }

      if (node.shorthand) {
        throw createJsonError("shorthand");
      }
      return [node.key, node.value].forEach(assertJsonChildNode);
    case "UnaryExpression":
      switch (node.operator) {
        case "+":
        case "-":
          return assertJsonChildNode(node.argument);
        default:
          throw createJsonError("operator");
      }
    case "Identifier":
      if (parent && parent.type === "ObjectProperty" && parent.key === node) {
        return;
      }
      throw createJsonError();
    case "NullLiteral":
    case "BooleanLiteral":
    case "NumericLiteral":
    case "StringLiteral":
      return;
    default:
      throw createJsonError();
  }

  function assertJsonChildNode(child) {
    return assertJsonNode(child, node);
  }

  function createJsonError(attribute) {
    const name = !attribute
      ? node.type
      : `${node.type} with ${attribute}=${JSON.stringify(node[attribute])}`;
    return createError(`${name} is not allowed in JSON.`, {
      start: {
        line: node.loc.start.line,
        column: node.loc.start.column + 1,
      },
    });
  }
}

const babel = { parse, astFormat: "estree", hasPragma, ...locFns };
const babelFlow = { ...babel, parse: parseFlow };
const babelTypeScript = { ...babel, parse: parseTypeScript };
const babelExpression = { ...babel, parse: parseExpression };

// Export as a plugin so we can reuse the same bundle for UMD loading
module.exports = {
  parsers: {
    babel,
    "babel-flow": babelFlow,
    "babel-ts": babelTypeScript,
    json: {
      ...babelExpression,
      hasPragma() {
        return true;
      },
    },
    json5: babelExpression,
    "json-stringify": {
      parse: parseJson,
      astFormat: "estree-json",
      ...locFns,
    },
    /** @internal */
    __js_expression: babelExpression,
    /** for vue filter */
    __vue_expression: babelExpression,
    /** for vue event binding to handle semicolon */
    __vue_event_binding: babel,
  },
};
