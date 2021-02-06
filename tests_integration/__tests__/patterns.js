"use strict";

const runPrettier = require("../runPrettier");

expect.addSnapshotSerializer(require("../path-serializer"));

test("multiple patterns", async () => {
  await runPrettier("cli/patterns", [
    "directory/**/*.js",
    "other-directory/**/*.js",
    "-l",
  ]).test({
    status: 1,
  });
});

test("multiple patterns with non exists pattern", async () => {
  await runPrettier("cli/patterns", [
    "directory/**/*.js",
    "non-existent.js",
    "-l",
  ]).test({
    status: 2,
  });
});

test("multiple patterns with ignore nested directories pattern", async () => {
  await runPrettier("cli/patterns", [
    "**/*.js",
    "!**/nested-directory/**",
    "-l",
  ]).test({
    status: 1,
  });
});

test("multiple patterns by with ignore pattern, ignores node_modules by default", async () => {
  await runPrettier("cli/patterns", ["**/*.js", "!directory/**", "-l"]).test({
    status: 1,
  });
});

test("multiple patterns by with ignore pattern, ignores node_modules by with ./**/*.js", async () => {
  await runPrettier("cli/patterns", ["./**/*.js", "!./directory/**", "-l"]).test({
    status: 1,
  });
});

test("multiple patterns by with ignore pattern, doesn't ignore node_modules with --with-node-modules flag", async () => {
  await runPrettier("cli/patterns", [
    "**/*.js",
    "!directory/**",
    "-l",
    "--with-node-modules",
  ]).test({
    status: 1,
  });
});

test("no errors on empty patterns", async () => {
  // --parser is mandatory if no filepath is passed
  await runPrettier("cli/patterns", ["--parser", "babel"]).test({
    status: 0,
  });
});

test("multiple patterns, throw error and exit with non zero code on non existing files", async () => {
  await runPrettier("cli/patterns", [
    "non-existent.js",
    "other-non-existent.js",
    "-l",
  ]).test({
    status: 2,
  });
});
