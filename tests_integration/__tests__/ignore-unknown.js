"use strict";

const runPrettier = require("../runPrettier");

test("ignore-unknown dir", async () => {
  await runPrettier("cli/ignore-unknown", [
    ".",
    "--ignore-unknown",
    "--list-different",
  ]).test({
    status: "non-zero",
    stderr: "",
    write: [],
  });
});

test("ignore-unknown alias", async () => {
  await runPrettier("cli/ignore-unknown", [".", "-u", "--list-different"]).test({
    status: "non-zero",
    stderr: "",
    write: [],
  });
});

test("ignore-unknown pattern", async () => {
  await runPrettier("cli/ignore-unknown", [
    "*",
    "--ignore-unknown",
    "--list-different",
  ]).test({
    status: "non-zero",
    stderr: "",
    write: [],
  });
});

test("ignore-unknown write", async () => {
  await runPrettier("cli/ignore-unknown", [
    ".",
    "--ignore-unknown",
    "--write",
    "--list-different",
  ]).test({
    status: 0,
    stderr: "",
  });
});

test("ignore-unknown check", async () => {
  await runPrettier("cli/ignore-unknown", [".", "--ignore-unknown", "--check"]).test({
    status: 1,
  });
});

test("None exist file", async () => {
  await runPrettier("cli/ignore-unknown", [
    "non-exist-file",
    "--ignore-unknown",
  ]).test({
    status: 2,
  });
});

test("Not matching pattern", async () => {
  await runPrettier("cli/ignore-unknown", [
    "*.non-exist-pattern",
    "--ignore-unknown",
  ]).test({
    status: 2,
  });
});

test("Ignored file", async () => {
  await runPrettier("cli/ignore-unknown", ["ignored.js", "--ignore-unknown"]).test({
    status: 0,
  });
});
