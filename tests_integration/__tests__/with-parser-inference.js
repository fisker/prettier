"use strict";

const prettier = require("prettier-local");
const runPrettier = require("../runPrettier");

test("infers postcss parser", async () => {
  await runPrettier("cli/with-parser-inference", ["--end-of-line", "lf", "*"]).test({
    status: 0,
  });
});

test("infers postcss parser with --check", async () => {
  await runPrettier("cli/with-parser-inference", ["--check", "*"]).test({
    status: 0,
  });
});

test("infers postcss parser with --list-different", async () => {
  await runPrettier("cli/with-parser-inference", ["--list-different", "*"]).test({
    status: 0,
  });
});

describe("infers parser from filename", () => {
  test("json from .prettierrc", () => {
    expect(
      prettier.format("  {   }  ", { filepath: "x/y/.prettierrc" })
    ).toEqual("{}\n");
  });

  test("babel from Jakefile", () => {
    expect(
      prettier.format("let foo = ( x = 1 ) => x", { filepath: "x/y/Jakefile" })
    ).toEqual("let foo = (x = 1) => x;\n");
  });
});
