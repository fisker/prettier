"use strict";

const normalizePlugin = (plugin) => {
  plugin = typeof plugin === "string" ? { name: plugin } : plugin;
  return {
    test: () => true,
    ...plugin,
  };
};

// When adding a plugin, please add a test in `tests/js/babel-plugins`,
// To remove plugins, remove it here and run `yarn test tests/js/babel-plugins` to verify
// https://babeljs.io/docs/en/babel-parser#plugins
const commonPlugins = [
  {
    name: "doExpressions",
    test: (text) => text.includes("do"),
  },
  {
    name: "classProperties",
    test: (text) => text.includes("class"),
  },
  {
    name: "exportDefaultFrom",
    test: (text) => text.includes("export") && text.includes("from"),
  },
  {
    name: "functionBind",
    test: (text) => text.includes("::"),
  },
  {
    name: "functionSent",
    // Actually it's `.sent`, but it could be `["sent"]` or something else?
    test: (text) => text.includes("sent"),
  },
  {
    name: "numericSeparator",
    test: (text) => /[\dA-Fa-f]_[\dA-Fa-f]/.test(text),
  },
  {
    name: "classPrivateProperties",
    test: (text) => text.includes("class") && text.includes("#"),
  },
  {
    name: "throwExpressions",
    test: (text) => text.includes("throw"),
  },
  {
    name: "logicalAssignment",
    test: (text) => text.includes("||=") || text.includes("&&="),
  },
  {
    name: "classPrivateMethods",
    test: (text) => text.includes("class") && text.includes("#"),
  },
  {
    name: "v8intrinsic",
    test: (text) => text.includes("%"),
  },
  {
    name: "partialApplication",
    test: (text) => text.includes("?"),
  },
  {
    name: "decorators",
    options: { decoratorsBeforeExport: false },
    test: (text) => text.includes("@"),
  },
  {
    name: "privateIn",
    test: (text) => text.includes("#") && text.includes("in"),
  },
  {
    name: "moduleAttributes",
    options: { version: "may-2020" },
    test: (text) => text.includes("import"),
  },
  {
    name: "recordAndTuple",
    options: { syntaxType: "hash" },
    test: (text) => text.includes("#[") || text.includes("#{"),
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
