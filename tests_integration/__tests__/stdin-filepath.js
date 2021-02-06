"use strict";

const { isCI } = require("ci-info");
const runPrettier = require("../runPrettier");

test("format correctly if stdin content compatible with stdin-filepath", async () => {
  await runPrettier(
    "cli",
    ["--stdin-filepath", "abc.css"],
    { input: ".name { display: none; }" } // css
  ).test({
    status: 0,
  });
});

test("throw error if stdin content incompatible with stdin-filepath", async () => {
  await runPrettier(
    "cli",
    ["--stdin-filepath", "abc.js"],
    { input: ".name { display: none; }" } // css
  ).test({
    status: "non-zero",
  });
});

test("gracefully handle stdin-filepath with nonexistent directory", async () => {
  await runPrettier(
    "cli",
    ["--stdin-filepath", "definitely/nonexistent/path.css"],
    { input: ".name { display: none; }" } // css
  ).test({
    status: 0,
  });
});

test("apply editorconfig for stdin-filepath with nonexistent file", async () => {
  await runPrettier(
    "cli",
    ["--stdin-filepath", "config/editorconfig/nonexistent.js"],
    {
      input: `
function f() {
  console.log("should be indented with a tab");
}
`.trim(), // js
    }
  ).test({
    status: 0,
  });
});

test("apply editorconfig for stdin-filepath with nonexistent directory", async () => {
  await runPrettier(
    "cli",
    ["--stdin-filepath", "config/editorconfig/nonexistent/one/two/three.js"],
    {
      input: `
function f() {
  console.log("should be indented with a tab");
}
`.trim(), // js
    }
  ).test({
    status: 0,
  });
});

test("apply editorconfig for stdin-filepath with a deep path", async () => {
  await runPrettier(
    "cli",
    ["--stdin-filepath", "config/editorconfig/" + "a/".repeat(30) + "three.js"],
    {
      input: `
function f() {
  console.log("should be indented with a tab");
}
`.trim(), // js
    }
  ).test({
    status: 0,
  });
});

if (isCI) {
  test("apply editorconfig for stdin-filepath in root", async () => {
    const code = `
function f() {
  console.log("should be indented with a tab");
}
`.trim();
    await runPrettier("cli", ["--stdin-filepath", "/foo.js"], {
      input: code, // js
    }).test({
      status: 0,
      stdout: code + "\n",
      stderr: "",
      write: [],
    });
  });
}

test("apply editorconfig for stdin-filepath with a deep path", async () => {
  await runPrettier(
    "cli",
    ["--stdin-filepath", "config/editorconfig/" + "a/".repeat(30) + "three.js"],
    {
      input: `
function f() {
  console.log("should be indented with a tab");
}
`.trim(), // js
    }
  ).test({
    status: 0,
  });
});

test("don’t apply editorconfig outside project for stdin-filepath with nonexistent directory", async () => {
  await runPrettier(
    "cli",
    [
      "--stdin-filepath",
      "config/editorconfig/repo-root/nonexistent/one/two/three.js",
    ],
    {
      input: `
function f() {
  console.log("should be indented with 2 spaces");
}
`.trim(), // js
    }
  ).test({
    status: 0,
  });
});

test("output file as-is if stdin-filepath matched patterns in ignore-path", async () => {
  await runPrettier("cli/stdin-ignore", ["--stdin-filepath", "ignore/example.js"], {
    input: "hello_world( );",
  }).test({
    stdout: "hello_world( );",
    status: 0,
  });
});
