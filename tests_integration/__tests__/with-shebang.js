"use strict";

const runPrettier = require("../runPrettier");

test("preserves shebang", async () => {
  await runPrettier("cli/with-shebang", ["--end-of-line", "lf", "issue1890.js"]).test(
    {
      status: 0,
    }
  );
});
