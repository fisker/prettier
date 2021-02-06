"use strict";

const runPrettier = require("../runPrettier");

test("checks stdin with --list-different", async () => {
  await runPrettier("cli/with-shebang", ["--list-different", "--parser", "babel"], {
    input: "0",
  }).test({
    stdout: "(stdin)\n",
    stderr: "",
    status: "non-zero",
  });
});

test("checks stdin with -l (alias for --list-different)", async () => {
  await runPrettier("cli/with-shebang", ["-l", "--parser", "babel"], {
    input: "0",
  }).test({
    stdout: "(stdin)\n",
    stderr: "",
    status: "non-zero",
  });
});

test("--list-different works in CI just as in a non-TTY mode", async () => {
  const result0 = await runPrettier(
    "cli/write",
    ["--list-different", "formatted.js", "unformatted.js"],
    {
      stdoutIsTTY: true,
      ci: true,
    }
  ).test({
    status: 1,
  });

  const result1 = await runPrettier(
    "cli/write",
    ["--list-different", "formatted.js", "unformatted.js"],
    {
      stdoutIsTTY: false,
    }
  ).test({
    status: 1,
  });

  expect(result0.stdout).toEqual(result1.stdout);
});
