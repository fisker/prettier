"use strict";

const runPrettier = require("../runPrettier");

test("write file with --write + unformatted file", async () => {
  await runPrettier("cli/write", ["--write", "unformatted.js"]).test({
    status: 0,
  });
});

test("write file with -w + unformatted file", async () => {
  await runPrettier("cli/write", ["-w", "unformatted.js"]).test({
    status: 0,
  });
});

test("do not write file with --write + formatted file", async () => {
  await runPrettier("cli/write", ["--write", "formatted.js"]).test({
    write: [],
    status: 0,
  });
});

test("do not write file with --write + invalid file", async () => {
  await runPrettier("cli/write", ["--write", "invalid.js"]).test({
    write: [],
    status: "non-zero",
  });
});
