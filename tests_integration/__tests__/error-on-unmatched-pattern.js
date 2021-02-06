"use strict";

const runPrettier = require("../runPrettier");

test("no error on unmatched pattern", async () => {
  await runPrettier("cli/error-on-unmatched-pattern", [
    "--no-error-on-unmatched-pattern",
    "**/*.js",
  ]).test({
    status: 0,
  });
});

test("error on unmatched pattern", async () => {
  await runPrettier("cli/error-on-unmatched-pattern", ["**/*.toml"]).test({
    status: 2,
  });
});

test("no error on unmatched pattern when 2nd glob has no match", async () => {
  await runPrettier("cli/error-on-unmatched-pattern", [
    "--no-error-on-unmatched-pattern",
    "**/*.{json,js,yml}",
    "**/*.toml",
  ]).test({
    status: 0,
  });
});

test("error on unmatched pattern when 2nd glob has no match", async () => {
  await runPrettier("cli/error-on-unmatched-pattern", [
    "**/*.{json,js,yml}",
    "**/*.toml",
  ]).test({
    status: 2,
  });
});
