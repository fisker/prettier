"use strict";

const normalizePlugin = (plugin) => {
  plugin = typeof plugin === "string" ? { name: plugin } : plugin;
  return {
    test: () => true,
    ...plugin,
  };
};

// https://babeljs.io/docs/en/babel-parser#plugins
const commonPlugins = [
  {
    name: "asyncGenerators",
    test: (text) =>
      text.includes("async") || text.includes("*") || text.includes("await"),
  },
  {
    name: "bigInt",
    test: (text) => /[\dA-Fa-f]n/.test(text),
  },
  {
    name: "classProperties",
    test: (text) => text.includes("class"),
  },
  {
    name: "classPrivateProperties",
    test: (text) => text.includes("class") && text.includes("#"),
  },
  {
    name: "classPrivateMethods",
    test: (text) => text.includes("class") && text.includes("#"),
  },
  {
    name: "decorators",
    options: { decoratorsBeforeExport: false },
    test: (text) => text.includes("@"),
  },
  {
    name: "doExpressions",
    test: (text) => text.includes("do"),
  },
  {
    name: "dynamicImport",
    // Comment is allowed `import /* comment*/ ("./index.mjs")`
    test: (text) => text.includes("import"),
  },
  {
    name: "exportDefaultFrom",
    test: (text) => text.includes("export") && text.includes("from"),
  },
  {
    name: "exportNamespaceFrom",
    test: (text) =>
      text.includes("export") && text.includes("as") && text.includes("from"),
  },
  {
    name: "functionBind",
    test: (text) => text.includes("::"),
  },
  // TBD: do we need this?
  {
    name: "functionSent",
    // Actually it's `.sent`, but it could be `["sent"]` or something else
    test: (text) => text.includes("sent"),
  },
  {
    name: "importMeta",
    test: (text) => text.includes("import") && text.includes("meta"),
  },
  {
    name: "logicalAssignment",
    test: (text) => text.includes("||=") || text.includes("&&="),
  },
  {
    name: "nullishCoalescingOperator",
    test: (text) => text.includes("??"),
  },
  {
    name: "numericSeparator",
    test: (text) => /[\dA-Fa-f]_[\dA-Fa-f]/.test(text),
  },
  {
    name: "objectRestSpread",
    test: (text) => text.includes("..."),
  },
  {
    name: "optionalCatchBinding",
    test: (text) => text.includes("try"),
  },
  {
    name: "optionalChaining",
    test: (text) => text.includes("?."),
  },
  {
    name: "partialApplication",
    test: (text) => text.includes("?"),
  },
  {
    name: "throwExpressions",
    test: (text) => text.includes("throw"),
  },
  {
    name: "v8intrinsic",
    test: (text) => text.includes("%"),
  },
].map((plugin) => normalizePlugin(plugin));

const jsxPlugin = {
  name: "jsx",
  test: (text) => /<\/|\/>/.test(text),
};

const filterPlugins = (plugins, text) =>
  plugins
    .filter(({ test }) => test(text))
    .map(({ name, options }) => [name, options]);

module.exports = {
  normalizePlugin,
  filterPlugins,
  commonPlugins,
  jsxPlugin,
};
