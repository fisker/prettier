"use strict";

const runPrettier = require("../runPrettier");

test("plugin default options should work", async () => {
  await runPrettier(
    "plugins/defaultOptions",
    [
      "--stdin-filepath",
      "example.foo",
      "--plugin=./plugin",
      "--no-editorconfig",
    ],
    { input: "hello-world" }
  ).test({
    stdout: JSON.stringify({
      tabWidth: 8,
      bracketSpacing: false,
    }),
    stderr: "",
    status: 0,
    write: [],
  });
});

test("overriding plugin default options should work", async () => {
  await runPrettier(
    "plugins/defaultOptions",
    ["--stdin-filepath", "example.foo", "--plugin=./plugin", "--tab-width=4"],
    { input: "hello-world" }
  ).test({
    stdout: JSON.stringify({
      tabWidth: 4,
      bracketSpacing: false,
    }),
    stderr: "",
    status: 0,
    write: [],
  });
});
