"use strict";

const runPrettier = require("../runPrettier");

test("prints information for debugging comment attachment with --debug-print-comments", async () => {
  await runPrettier(
    "cli/with-shebang",
    ["--debug-print-comments", "--parser", "babel"],
    { input: "/* 1 */\nconsole.log(foo /* 2 */); // 3" }
  ).test({
    stderr: "",
    status: 0,
  });
});
