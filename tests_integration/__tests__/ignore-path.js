"use strict";

const runPrettier = require("../runPrettier");

test("ignore path", async () => {
  await runPrettier("cli/ignore-path", [
    "**/*.js",
    "--ignore-path",
    ".gitignore",
    "-l",
  ]).test({
    status: 1,
  });
});

test("support .prettierignore", async () => {
  await runPrettier("cli/ignore-path", ["**/*.js", "-l"]).test({
    status: 1,
  });
});

test("ignore file when using --debug-check", async () => {
  await runPrettier("cli/ignore-path", ["**/*.js", "--debug-check"]).test({
    status: 0,
  });
});

test("outputs files as-is if no --write", async () => {
  await runPrettier("cli/ignore-path", ["regular-module.js"], {
    ignoreLineEndings: true,
  }).test({
    status: 0,
  });
});
