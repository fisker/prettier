"use strict";

const runPrettier = require("../runPrettier");

test("output with --check + unformatted differs when piped", async () => {
  const result0 = await runPrettier(
    "cli/write",
    ["--write", "--check", "--no-color", "unformatted.js"],
    { stdoutIsTTY: true }
  ).test({
    status: 0,
  });

  const result1 = await runPrettier(
    "cli/write",
    ["--write", "--check", "--no-color", "unformatted.js"],
    { stdoutIsTTY: false }
  ).test({
    status: 0,
  });

  expect(result0.stdout.length).toBeGreaterThan(result1.stdout.length);
  expect(result0.write).toEqual(result1.write);
});

test("no file diffs with --check + formatted file", async () => {
  const result0 = await runPrettier(
    "cli/write",
    ["--write", "--check", "--no-color", "formatted.js"],
    { stdoutIsTTY: true }
  ).test({
    status: 0,
  });

  const result1 = await runPrettier(
    "cli/write",
    ["--write", "--check", "--no-color", "formatted.js"],
    { stdoutIsTTY: false }
  ).test({
    status: 0,
  });

  expect(result0.stdout).not.toEqual(result1.stdout);
  expect(result0.stdout.length).toBeGreaterThan(result1.stdout.length);
  expect(result0.write).toEqual(result1.write);
});

test("output with --list-different + unformatted differs when piped", async () => {
  const result0 = await runPrettier(
    "cli/write",
    ["--write", "--list-different", "--no-color", "unformatted.js"],
    { stdoutIsTTY: true }
  ).test({
    status: 0,
  });

  const result1 = await runPrettier(
    "cli/write",
    ["--write", "--list-different", "--no-color", "unformatted.js"],
    { stdoutIsTTY: false }
  ).test({
    status: 0,
  });

  expect(result0.stdout.length).toBeGreaterThan(result1.stdout.length);
  expect(result0.write).toEqual(result1.write);
});

test("no file diffs with --list-different + formatted file", async () => {
  const result0 = await runPrettier(
    "cli/write",
    ["--write", "--list-different", "--no-color", "formatted.js"],
    { stdoutIsTTY: true }
  ).test({
    status: 0,
  });

  const result1 = await runPrettier(
    "cli/write",
    ["--write", "--list-different", "--no-color", "formatted.js"],
    { stdoutIsTTY: false }
  ).test({
    status: 0,
  });

  expect(result0.stdout).not.toEqual(result1.stdout);
  expect(result0.stdout.length).toBeGreaterThan(result1.stdout.length);
  expect(result0.write).toEqual(result1.write);
});
