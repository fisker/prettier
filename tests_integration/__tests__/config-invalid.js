"use strict";

const runPrettier = require("../runPrettier");

expect.addSnapshotSerializer(require("../path-serializer"));

test("throw error for unsupported extension", async () => {
  await runPrettier("cli/config/invalid", [
    "--config",
    "file/.prettierrc.unsupported",
  ]).test({
    status: "non-zero",
  });
});

test("throw error with invalid config format", async () => {
  await runPrettier("cli/config/invalid", ["--config", "file/.prettierrc"]).test({
    status: "non-zero",
    stderr: expect.stringMatching(
      /Cannot (?:resolve|find) module '--invalid--' from/
    ),
  });
});

test("throw error with invalid config format", async () => {
  await runPrettier("cli/config/invalid", [
    "--config",
    "type-error/.prettierrc",
  ]).test({
    status: "non-zero",
    stderr: expect.stringMatching(
      "Config is only allowed to be an object, but received number in"
    ),
  });
});

test("throw error with invalid config target (directory)", async () => {
  await runPrettier("cli/config/invalid", [
    "--config",
    "folder/.prettierrc", // this is a directory
  ]).test({
    status: "non-zero",
  });
});

test("throw error with invalid config option (int)", async () => {
  await runPrettier("cli/config/invalid", ["--config", "option/int"]).test({
    status: "non-zero",
  });
});

test("throw error with invalid config option (trailingComma)", async () => {
  await runPrettier("cli/config/invalid", ["--config", "option/trailingComma"]).test({
    status: "non-zero",
  });
});

test("throw error with invalid config precedence option (configPrecedence)", async () => {
  await runPrettier("cli/config/invalid", [
    "--config-precedence",
    "option/configPrecedence",
  ]).test({
    status: "non-zero",
  });
});

test("resolves external configuration from package.json", async () => {
  await runPrettier("cli/config-external-config-syntax-error", [
    "syntax-error.js",
  ]).test({
    status: 2,
  });
});

// Tests below require --parser to prevent an error (no parser/filepath specified)

test("show warning with unknown option", async () => {
  await runPrettier("cli/config/invalid", [
    "--config",
    "option/unknown",
    "--parser",
    "babel",
  ]).test({
    status: 0,
  });
});

test("show warning with kebab-case option key", async () => {
  await runPrettier("cli/config/invalid", [
    "--config",
    "option/kebab-case",
    "--parser",
    "babel",
  ]).test({
    status: 0,
  });
});
