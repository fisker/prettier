"use strict";

const runPrettier = require("../runPrettier");

expect.addSnapshotSerializer(require("../path-serializer"));

test("skips folders in glob", async () => {
  await runPrettier("cli/skip-folders", ["**/*", "-l"]).test({
    status: 1,
    stderr: "",
  });
});

test("skip folders passed specifically", async () => {
  await runPrettier("cli/skip-folders", [
    "a",
    "a/file.js",
    "b",
    "b/file.js",
    "-l",
  ]).test({ status: 1, stderr: "" });
});
