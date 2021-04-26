"use strict";

const fs = require("fs");
const vm = require("vm");
const globby = require("globby");

const sandbox = vm.createContext();

const source = globby
  .sync(["standalone.js", "parser-*.js"], {
    cwd: process.env.PRETTIER_DIR,
    absolute: true,
  })
  .map((file) => fs.readFileSync(file, "utf8"))
  .join(";");

vm.runInContext(source, sandbox);

const allowedGlobalObjects = new Set(["prettier", "prettierPlugins"]);
const globalObjects = Object.keys(sandbox).filter(
  (property) => !allowedGlobalObjects.has(property)
);
if (globalObjects.length > 0) {
  throw new Error(
    `Global ${globalObjects
      .map(
        (property) =>
          `"${property}"(${Object.prototype.toString
            .call(sandbox[property])
            .slice(8, -1)})`
      )
      .join(", ")} should not be exposed.`
  );
}

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
