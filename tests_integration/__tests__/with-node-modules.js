"use strict";

const runPrettier = require("../runPrettier");

expect.addSnapshotSerializer(require("../path-serializer"));

test("ignores node_modules by default", async () => {
  await runPrettier("cli/with-node-modules", ["**/*.js", "-l"]).test({
    status: 1,
  });
});

test("ignores node_modules by with ./**/*.js", async () => {
  await runPrettier("cli/with-node-modules", ["./**/*.js", "-l"]).test({
    status: 1,
  });
});

test("doesn't ignore node_modules with --with-node-modules flag", async () => {
  await runPrettier("cli/with-node-modules", [
    "**/*.js",
    "-l",
    "--with-node-modules",
  ]).test({
    status: 1,
  });
});

test("ignores node_modules by default for file list", async () => {
  await runPrettier("cli/with-node-modules", [
    "node_modules/node-module.js",
    "not_node_modules/file.js",
    "nested/node_modules/node-module.js",
    "regular-module.js",
    "-l",
  ]).test({
    status: 1,
  });
});

test("doesn't ignore node_modules with --with-node-modules flag for file list", async () => {
  await runPrettier("cli/with-node-modules", [
    "node_modules/node-module.js",
    "not_node_modules/file.js",
    "nested/node_modules/node-module.js",
    "regular-module.js",
    "-l",
    "--with-node-modules",
  ]).test({
    status: 1,
  });
});
