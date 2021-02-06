"use strict";

const runPrettier = require("../runPrettier");

test("json-stringify takes precedence over json for package.json", async () => {
  await runPrettier("plugins", ["--stdin-filepath=package.json"], {
    input:
      '{ "a": "longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong" }',
  }).test({
    stdout:
      '{\n  "a": "longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"\n}\n',
    stderr: "",
    status: 0,
    write: [],
  });
});
