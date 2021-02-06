"use strict";

const runPrettier = require("../runPrettier");
expect.addSnapshotSerializer(require("../path-serializer"));

test("boolean flags do not swallow the next argument", async () => {
  await runPrettier("cli/arg-parsing", [
    "--end-of-line",
    "lf",
    "--single-quote",
    "file.js",
  ]).test({
    status: 0,
  });
});

test("negated options work", async () => {
  await runPrettier("cli/arg-parsing", [
    "--end-of-line",
    "lf",
    "--no-semi",
    "file.js",
  ]).test({
    status: 0,
  });
});

test("unknown options are warned", async () => {
  await runPrettier("cli/arg-parsing", [
    "--end-of-line",
    "lf",
    "file.js",
    "--unknown",
  ]).test({
    status: 0,
  });
});

test("unknown negated options are warned", async () => {
  await runPrettier("cli/arg-parsing", [
    "--end-of-line",
    "lf",
    "file.js",
    "--no-unknown",
  ]).test({
    status: 0,
  });
});

test("unknown options not suggestion `_`", async () => {
  await runPrettier("cli/arg-parsing", ["file.js", "-a"]).test({
    status: 0,
    write: [],
  });
});

test("allow overriding flags", async () => {
  await runPrettier(
    "cli/arg-parsing",
    ["--tab-width=1", "--tab-width=3", "--parser=babel"],
    { input: "function a() { b }" }
  ).test({
    stdout: "function a() {\n   b;\n}\n",
    status: 0,
  });
});

test("number file/dir", async () => {
  const patterns = ["1", "2.2", "3", "4.44"];
  for (const pattern of patterns) {
    await runPrettier("cli/arg-parsing/number", [
      "--parser=babel",
      "--list-different",
      pattern,
    ]).test({
      stderr: "",
      status: 1,
      write: [],
    });
  }
  await runPrettier("cli/arg-parsing/number", [
    "--parser=babel",
    "--list-different",
    ...patterns,
  ]).test({
    stderr: "",
    status: 1,
    write: [],
  });
});
