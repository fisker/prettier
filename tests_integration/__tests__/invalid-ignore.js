"use strict";

const path = require("path");
const prettier = require("prettier-local");
const runPrettier = require("../runPrettier");

expect.addSnapshotSerializer(require("../path-serializer"));

test("throw error with invalid ignore", async () => {
  await runPrettier("cli/invalid-ignore", ["something.js"]).test({
    status: "non-zero",
  });

  test("sync api", async () => {
    await expect(
      prettier.getFileInfo("something.js", {
        ignorePath: path.join(
          __dirname,
          "../cli/invalid-ignore/.prettierignore"
        ),
      })
    ).rejects.toThrow(/EISDIR: illegal operation on a directory/);
  });
});
