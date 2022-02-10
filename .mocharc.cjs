"use strict";

module.exports = {
  extension: ["js", "cjs", "mjs"],
  ui: "bdd",
  require: "./tests/config/mocha-setup.js",
  timeout: 6000,
};
