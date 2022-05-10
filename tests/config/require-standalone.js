"use strict";
const vm = require("vm");
const fastGlob = require("fast-glob");
const createSandBox = require("./utils/create-sandbox.js");

const sandbox = createSandBox({
  files: fastGlob.sync(["standalone.js", "parser-*.js"], {
    cwd: process.env.PRETTIER_DIR,
    absolute: true,
  }),
});

const { prettier, prettierPlugins } = sandbox;

const addBuiltinPlugins = (fn) => (input, options, ...rest) => {
  options = {
    ...options,
    plugins: [...Object.values(prettierPlugins), ...(options.plugins || [])],
  };
  return fn(input, options, ...rest);
};

// TODO: maybe expose (and write tests) for `format`, `utils`, and
// `__debug` methods
module.exports = {
  formatWithCursor: addBuiltinPlugins(prettier.formatWithCursor),
  __debug: {
    parse: addBuiltinPlugins(prettier.__debug.parse),
  },
};
