"use strict";

const runPrettier = require("../runPrettier");

test("checks stdin with --check", async () => {
  await runPrettier("cli/with-shebang", ["--check", "--parser", "babel"], {
    input: "0",
  }).test({
    stdout: "(stdin)\n",
    stderr: "",
    status: "non-zero",
  });
});

test("checks stdin with -c (alias for --check)", async () => {
  await runPrettier("cli/with-shebang", ["-c", "--parser", "babel"], {
    input: "0",
  }).test({
    stdout: "(stdin)\n",
    stderr: "",
    status: "non-zero",
  });
});

test("--checks works in CI just as in a non-TTY mode", async () => {
  const result0 = await runPrettier(
    "cli/write",
    ["--check", "formatted.js", "unformatted.js"],
    {
      stdoutIsTTY: true,
      ci: true,
    }
  ).test({
    status: 1,
  });

  const result1 = await runPrettier(
    "cli/write",
    ["--check", "formatted.js", "unformatted.js"],
    {
      stdoutIsTTY: false,
    }
  ).test({
    status: 1,
  });

  expect(result0.stdout).toEqual(result1.stdout);
});
