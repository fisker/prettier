"use strict";

const runPrettier = require("../runPrettier");
const EOL = "\n";

test("automatically loads 'prettier-plugin-*'", async () => {
  await runPrettier("plugins/automatic", ["file.txt", "--parser=bar"]).test({
    stdout: "content from `prettier-plugin-bar` package + contents" + EOL,
    stderr: "",
    status: 0,
    write: [],
  });
});

test("automatically loads '@prettier/plugin-*'", async () => {
  await runPrettier("plugins/automatic", ["file.txt", "--parser=foo"]).test({
    stdout: "foo+contents" + EOL,
    stderr: "",
    status: 0,
    write: [],
  });
});

test("automatically loads '@<name>/prettier-plugin-*'", async () => {
  await runPrettier("plugins/automatic", ["file.txt", "--parser=foobar"]).test({
    stdout: "foobar+contents" + EOL,
    stderr: "",
    status: 0,
    write: [],
  });
});

test("automatically loads 'prettier-plugin-*' from --plugin-search-dir (same as autoload dir)", async () => {
  await runPrettier("plugins/automatic", [
    "file.txt",
    "--parser=foo",
    "--plugin-search-dir=.",
  ]).test({
    stdout: "foo+contents" + EOL,
    stderr: "",
    status: 0,
    write: [],
  });
});

test("automatically loads '@prettier/plugin-*' from --plugin-search-dir (same as autoload dir)", async () => {
  await runPrettier("plugins/automatic", [
    "file.txt",
    "--parser=bar",
    "--plugin-search-dir=.",
  ]).test({
    stdout: "content from `prettier-plugin-bar` package + contents" + EOL,
    stderr: "",
    status: 0,
    write: [],
  });
});

test("automatically loads '@<name>/prettier-plugin-*' from --plugin-search-dir (same as autoload dir)", async () => {
  await runPrettier("plugins/automatic", [
    "file.txt",
    "--parser=foobar",
    "--plugin-search-dir=.",
  ]).test({
    stdout: "foobar+contents" + EOL,
    stderr: "",
    status: 0,
    write: [],
  });
});

test("automatically loads 'prettier-plugin-*' from --plugin-search-dir (different to autoload dir)", async () => {
  await runPrettier("plugins", [
    "automatic/file.txt",
    "--parser=foo",
    "--plugin-search-dir=automatic",
  ]).test({
    stdout: "foo+contents" + EOL,
    stderr: "",
    status: 0,
    write: [],
  });
});

test("automatically loads '@prettier/plugin-*' from --plugin-search-dir (different to autoload dir)", async () => {
  await runPrettier("plugins", [
    "automatic/file.txt",
    "--parser=bar",
    "--plugin-search-dir=automatic",
  ]).test({
    stdout: "content from `prettier-plugin-bar` package + contents" + EOL,
    stderr: "",
    status: 0,
    write: [],
  });
});

test("does not crash when --plugin-search-dir does not contain node_modules", async () => {
  await runPrettier(
    "plugins/extensions",
    [
      "file.foo",
      "--end-of-line",
      "lf",
      "--plugin=./plugin",
      "--plugin-search-dir=.",
    ],
    { ignoreLineEndings: true }
  ).test({
    stdout: "!contents" + EOL,
    stderr: "",
    status: 0,
    write: [],
  });
});

test("crashes when one of --plugin-search-dir does not exist", async () => {
  await runPrettier("plugins/automatic", [
    "file.txt",
    "--parser=foo",
    "--plugin-search-dir=non-existing-dir",
    "--plugin-search-dir=.",
  ]).test({
    stdout: "",
    stderr: "[error] non-existing-dir does not exist or is not a directory\n",
    status: 1,
    write: [],
  });
});

test("loads --plugin by its relative path", async () => {
  await runPrettier("plugins", [
    "automatic/file.txt",
    "--parser=bar",
    "--plugin=./automatic/node_modules/prettier-plugin-bar/index.js",
  ]).test({
    stdout: "content from `prettier-plugin-bar` package + contents" + EOL,
    stderr: "",
    status: 0,
    write: [],
  });
});

test("loads --plugin by its relative path without leading ./", async () => {
  await runPrettier("plugins", [
    "automatic/file.txt",
    "--parser=bar",
    "--plugin=automatic/node_modules/prettier-plugin-bar/index.js",
  ]).test({
    stdout: "content from `prettier-plugin-bar` package + contents" + EOL,
    stderr: "",
    status: 0,
    write: [],
  });
});

test("loads --plugin by relative path to its directory (assuming index.js)", async () => {
  await runPrettier("plugins", [
    "automatic/file.txt",
    "--parser=bar",
    "--plugin=./automatic/node_modules/prettier-plugin-bar",
  ]).test({
    stdout: "content from `prettier-plugin-bar` package + contents" + EOL,
    stderr: "",
    status: 0,
    write: [],
  });
});

test("loads --plugin by relative path to its directory without leading ./ (assuming index.js)", async () => {
  await runPrettier("plugins", [
    "automatic/file.txt",
    "--parser=bar",
    "--plugin=automatic/node_modules/prettier-plugin-bar",
  ]).test({
    stdout: "content from `prettier-plugin-bar` package + contents" + EOL,
    stderr: "",
    status: 0,
    write: [],
  });
});

test("loads --plugin by filename without leading ./ and ext, should resolve to file, not package", async () => {
  await runPrettier("plugins/automatic", [
    "file.txt",
    "--parser=bar",
    "--plugin=prettier-plugin-bar",
  ]).test({
    stdout: "content from `prettier-plugin-bar.js` file + contents" + EOL,
    stderr: "",
    status: 0,
    write: [],
  });
});

test("loads --plugin by bespoke plugin name (assuming it is installed in cwd)", async () => {
  await runPrettier("plugins/bespoke", [
    "../automatic/file.txt",
    "--parser=bespoke",
    "--plugin=@company/prettier-plugin-bespoke",
  ]).test({
    stdout: "bespoke+contents" + EOL,
    stderr: "",
    status: 0,
    write: [],
  });
});
