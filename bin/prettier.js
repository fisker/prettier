#!/usr/bin/env node

"use strict";

const promise = require("../src/cli/index.js").run(process.argv.slice(2));

module.exports = { promise };
