"use strict";

const runPrettier = require("../runPrettier");

expect.addSnapshotSerializer(require("../path-serializer"));

test("ignores file name contains emoji", async () => {
  await runPrettier("cli/ignore-emoji", ["**/*.js", "-l"]).test({
    status: 1,
  });
});

test("stdin", async () => {
  await runPrettier(
    "cli/ignore-emoji",
    ["--stdin-filepath", "ignored/我的样式.css"],
    { input: ".name {                         display: none; }" }
  ).test({
    status: 0,
  });
});
