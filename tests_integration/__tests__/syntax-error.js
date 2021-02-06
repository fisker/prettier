"use strict";

const runPrettier = require("../runPrettier");

test("exits with non-zero code when input has a syntax error", async () => {
  await runPrettier("cli/with-shebang", ["--parser", "babel"], {
    input: "a.2",
  }).test({
    status: 2,
  });
});
