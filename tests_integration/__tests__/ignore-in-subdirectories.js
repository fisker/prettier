"use strict";

const runPrettier = require("../runPrettier");

expect.addSnapshotSerializer(require("../path-serializer"));

test("ignores files when executing in a subdirectory", async () => {
  await runPrettier("cli/ignore-in-subdirectories/web1", [
    "ignore-me/should-ignore.js",
    "--ignore-path",
    "../.prettierignore",
    "-l",
  ]).test({
    status: 0,
  });

  await runPrettier("cli/ignore-in-subdirectories/web1", [
    "ignore-me/subdirectory/should-ignore.js",
    "--ignore-path",
    "../.prettierignore",
    "-l",
  ]).test({
    status: 0,
  });
});

test("formats files when executing in a subdirectory", async () => {
  await runPrettier("cli/ignore-in-subdirectories/web1", [
    "should-not-ignore.js",
    "--ignore-path",
    "../.prettierignore",
    "-l",
  ]).test({
    status: 1,
  });

  await runPrettier("cli/ignore-in-subdirectories/web2", [
    "should-not-ignore.js",
    "--ignore-path",
    "../.prettierignore",
    "-l",
  ]).test({
    status: 1,
  });
});

test("ignore files when executing in a subdirectory and using stdin", async () => {
  await runPrettier(
    "cli/ignore-in-subdirectories/web1",
    [
      "--ignore-path",
      "../.prettierignore",
      "--stdin-filepath",
      "ignore-me/example.js",
    ],
    {
      input: "hello_world( );",
    }
  ).test({
    stdout: "hello_world( );",
    status: 0,
  });
});

test("formats files when executing in a subdirectory and using stdin", async () => {
  await runPrettier(
    "cli/ignore-in-subdirectories/web1",
    ["--ignore-path", "../.prettierignore", "--stdin-filepath", "example.js"],
    {
      input: "hello_world( );",
    }
  ).test({
    stdout: `hello_world();
`,
    status: 0,
  });
});
