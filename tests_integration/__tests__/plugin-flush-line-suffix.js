"use strict";

const runPrettier = require("../runPrettier");

test("flush all line-suffix content", async () => {
  await runPrettier("plugins/flushLineSuffix", ["*.foo", "--plugin=./plugin"], {
    ignoreLineEndings: true,
  }).test({
    stdout: "contents",
    stderr: "",
    status: 0,
    write: [],
  });
});
