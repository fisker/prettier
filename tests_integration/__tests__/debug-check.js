"use strict";

const runPrettier = require("../runPrettier");

test("doesn't crash when --debug-check is passed", async () => {
  await runPrettier("cli/with-shebang", ["issue1890.js", "--debug-check"]).test({
    stdout: "issue1890.js\n",
    stderr: "",
    status: 0,
  });
});

test("checks stdin with --debug-check", async () => {
  await runPrettier("cli/with-shebang", ["--debug-check", "--parser", "babel"], {
    input: "0",
  }).test({
    stdout: "(stdin)\n",
    stderr: "",
    status: 0,
  });
});

test("show diff for 2+ error files with --debug-check", async () => {
  await runPrettier("cli/debug-check", [
    "--end-of-line",
    "lf",
    "*.debug-check",
    "--debug-check",
    "--plugin",
    "./plugin-for-testing-debug-check",
  ]).test({
    status: "non-zero",
  });
});

test("should not exit non-zero for already prettified code with --debug-check + --check", async () => {
  await runPrettier("cli/debug-check", [
    "issue-4599.js",
    "--debug-check",
    "--check",
  ]).test({
    status: 0,
  });
});

test("should not exit non-zero for already prettified code with --debug-check + --list-different", async () => {
  await runPrettier("cli/debug-check", [
    "issue-4599.js",
    "--debug-check",
    "--list-different",
  ]).test({
    status: 0,
  });
});
