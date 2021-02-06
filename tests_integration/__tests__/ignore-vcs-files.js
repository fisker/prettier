"use strict";

const runPrettier = require("../runPrettier");

expect.addSnapshotSerializer(require("../path-serializer"));

test("ignores files in version control systems", async () => {
  await runPrettier("cli/ignore-vcs-files", [
    ".svn/file.js",
    ".hg/file.js",
    "file.js",
    "-l",
  ]).test({
    status: 1,
  });
});
