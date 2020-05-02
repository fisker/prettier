"use strict";

const createError = require("../common/parser-create-error");
const { hasPragma } = require("./pragma");
const locFns = require("./loc");
const postprocess = require("./postprocess");

// https://babeljs.io/docs/en/babel-parser#plugins
const babelPlugins = [
  {
    name: "asyncGenerators",
    test(text) {
      return (
        text.includes("async") || text.includes("*") || text.includes("await")
      );
    },
  },
  {
    name: "bigInt",
    test(text) {
      return /[\dA-Fa-f]n/.test(text);
    },
  },
  {
    name: "classProperties",
    test(text) {
      return text.includes("class");
    },
  },
  {
    name: "classPrivateProperties",
    test(text) {
      return text.includes("class") && text.includes("#");
    },
  },
  {
    name: "classPrivateMethods",
    test(text) {
      return text.includes("class") && text.includes("#");
    },
  },
  {
    name: "decorators",
    options: { decoratorsBeforeExport: false },
    test(text) {
      return text.includes("@");
    },
  },
  {
    name: "doExpressions",
    test(text) {
      return text.includes("do");
    },
  },
  {
    name: "dynamicImport",
    test(text) {
      return text.includes("import(");
    },
  },
  {
    name: "exportDefaultFrom",
    test(text) {
      return text.includes("export") && text.includes("from");
    },
  },
  // TODO: this is not enabled
  // {
  //   name: "exportNamespaceFrom",
  //   test(text) {
  //     return text.includes("export") && text.includes("as") && text.includes("from");
  //   },
  // },
  {
    name: "functionBind",
    test(text) {
      return text.includes("::");
    },
  },
  // TBD: do we need this?
  {
    name: "functionSent",
    test(text) {
      // Actually it's `.sent`, but it could be `["sent"]` or something else
      return text.includes("sent");
    },
  },
  {
    name: "importMeta",
    test(text) {
      return text.includes("import") && text.includes("meta");
    },
  },
  {
    name: "logicalAssignment",
    test(text) {
      return text.includes("||=") || text.includes("&&=");
    },
  },
  {
    name: "nullishCoalescingOperator",
    test(text) {
      return text.includes("??");
    },
  },
  {
    name: "numericSeparator",
    test(text) {
      return /[\dA-Fa-f]_[\dA-Fa-f]/.test(text);
    },
  },
  {
    name: "objectRestSpread",
    test(text) {
      return text.includes("...");
    },
  },
  {
    name: "optionalCatchBinding",
    test(text) {
      // TBD: `/try\s*<!=(>/` ?
      return text.includes("try");
    },
  },
  {
    name: "optionalChaining",
    test(text) {
      return text.includes("?.");
    },
  },
  {
    name: "partialApplication",
    test(text) {
      return text.includes("?");
    },
  },
  {
    name: "throwExpressions",
    test(text) {
      return text.includes("throw");
    },
  },

  // TODO: enable this
  // {
  //   name: "jsx",
  //   test(text) {
  //     return /<\/|\/>/.test(text);
  //   },
  // },
  {
    name: "v8intrinsic",
    test(text) {
      return text.includes("%");
    },
  },
].map((plugin) => ({
  test: () => true,
  ...plugin,
}));

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
    const plugins = babelPlugins
      .filter(({ test }) => test(text))
      .map(({ name, options }) => [name, options]);

    const pluginCombinations2 = pluginCombinations.map((combinations) =>
      combinations
        .map((plugin) => {
          plugin = typeof plugin === "string" ? { name: plugin } : plugin;
          return {
            test: () => true,
            ...plugin,
          };
        })
        .filter(({ test }) => test(text))
        .map(({ name, options }) => [name, options])
    );

    let ast;
    try {
      const combinations = resolvePluginsConflict(
        text.includes("|>"),
        pluginCombinations2,
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
  {
    name: "jsx",
    test(text) {
      return /<\/|\/>/.test(text);
    },
  },
  {
    name: "flow",
    test(text) {
      return text.includes("@flow");
    },
  },
]);
const parseFlow = createParse("parse", [
  {
    name: "jsx",
    test(text) {
      return /<\/|\/>/.test(text);
    },
  },
  {
    name: "flow",
    options: { all: true, enums: true },
  },
]);
const parseTypeScript = createParse(
  "parse",
  [
    {
      name: "jsx",
      test(text) {
        return /<\/|\/>/.test(text);
      },
    },
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
const parseExpression = createParse("parseExpression", [
  {
    name: "jsx",
    test(text) {
      return /<\/|\/>/.test(text);
    },
  },
]);

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
