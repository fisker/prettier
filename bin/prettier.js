#!/usr/bin/env node

"use strict";

const importLocal = require("import-local");

// Prefer the local installation of Prettier
if (!importLocal(__filename)) {
  require("./cli").run(process.argv.slice(2));
}
