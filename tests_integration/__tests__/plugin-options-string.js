"use strict";

const snapshotDiff = require("snapshot-diff");
const runPrettier = require("../runPrettier");

test("show external options with `--help`", async () => {
  const originalStdout = await runPrettier("plugins/options-string", ["--help"])
    .stdout;
  const pluggedStdout = await runPrettier("plugins/options-string", [
    "--help",
    "--plugin=./plugin",
  ]).stdout;
  expect(snapshotDiff(originalStdout, pluggedStdout)).toMatchSnapshot();
});

test("show detailed external option with `--help foo-string`", async () => {
  await runPrettier("plugins/options-string", [
    "--plugin=./plugin",
    "--help",
    "foo-string",
  ]).test({
    status: 0,
  });
});

test("external options from CLI should work", async () => {
  await runPrettier(
    "plugins/options-string",
    [
      "--plugin=./plugin",
      "--stdin-filepath",
      "example.foo",
      "--foo-string",
      "baz",
    ],
    { input: "hello-world" }
  ).test({
    stdout: "foo:baz",
    stderr: "",
    status: 0,
    write: [],
  });
});

test("external options from config file should work", async () => {
  await runPrettier(
    "plugins/options-string",
    ["--config=./config.json", "--stdin-filepath", "example.foo"],
    { input: "hello-world" }
  ).test({
    stdout: "foo:baz",
    stderr: "",
    status: 0,
    write: [],
  });
});

test("Non exists plugin", async () => {
  await runPrettier(
    "plugins/options-string",
    ["--plugin=--invalid--", "--stdin-filepath", "example.foo"],
    { input: "hello-world" }
  ).test({
    stdout: "",
    stderr: expect.stringMatching(
      /Cannot (?:resolve|find) module '--invalid--' from/
    ),
    status: 1,
    write: [],
  });
});
