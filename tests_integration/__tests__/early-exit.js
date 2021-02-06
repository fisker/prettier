"use strict";

const prettier = require("prettier-local");
const runPrettier = require("../runPrettier");

test("show version with --version", async () => {
  await runPrettier("cli/with-shebang", ["--version"]).test({
    stdout: prettier.version + "\n",
    status: 0,
  });
});

test("show usage with --help", async () => {
  await runPrettier("cli", ["--help"]).test({
    status: 0,
  });
});

test("show detailed usage with --help l (alias)", async () => {
  await runPrettier("cli", ["--help", "l"]).test({
    status: 0,
  });
});

test("show detailed usage with plugin options (automatic resolution)", async () => {
  await runPrettier("plugins/automatic", [
    "--help",
    "tab-width",
    "--parser=bar",
    "--plugin-search-dir=.",
  ]).test({
    status: 0,
  });
});

test("show detailed usage with plugin options (manual resolution)", async () => {
  await runPrettier("cli", [
    "--help",
    "tab-width",
    "--plugin=../plugins/automatic/node_modules/prettier-plugin-bar",
    "--parser=bar",
  ]).test({
    status: 0,
  });
});

test("throw error with --help not-found", async () => {
  await runPrettier("cli", ["--help", "not-found"]).test({
    status: 1,
  });
});

test("show warning with --help not-found (typo)", async () => {
  await runPrettier("cli", [
    "--help",
    // cspell:disable-next-line
    "parserr",
  ]).test({
    status: 0,
  });
});

test("throw error with --check + --list-different", async () => {
  await runPrettier("cli", ["--check", "--list-different"]).test({
    status: 1,
  });
});

test("throw error with --write + --debug-check", async () => {
  await runPrettier("cli", ["--write", "--debug-check"]).test({
    status: 1,
  });
});

test("throw error with --find-config-path + multiple files", async () => {
  await runPrettier("cli", ["--find-config-path", "abc.js", "def.js"]).test({
    status: 1,
  });
});

test("throw error with --file-info + multiple files", async () => {
  await runPrettier("cli", ["--file-info", "abc.js", "def.js"]).test({
    status: 1,
  });
});

test("throw error and show usage with something unexpected", async () => {
  await runPrettier("cli", [], { isTTY: true }).test({
    status: "non-zero",
  });
});

test("node version error", async () => {
  const originalProcessVersion = process.version;
  try {
    Object.defineProperty(process, "version", {
      value: "v8.0.0",
      writable: false,
    });
    await runPrettier("cli", ["--help"]).test({ status: 1 });
  } finally {
    Object.defineProperty(process, "version", {
      value: originalProcessVersion,
      writable: false,
    });
  }
});
