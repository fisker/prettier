import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import stripAnsi from "strip-ansi";
import createEsmUtils from "esm-utils";
import { prettierCli, thirdParty } from "./env.js";

const { __dirname, require, __filename } = createEsmUtils(import.meta);

async function run(dir, args, options) {
  args = Array.isArray(args) ? args : [args];

  let status;
  let stdout = "";
  let stderr = "";

  td.replace(process, "exit", (exitCode) => {
    if (status === undefined) {
      status = exitCode || 0;
    }
  });
  td.replace(process.stdout, "write", (text) => appendStdout(text));
  td.replace(process.stderr, "write", (text) => appendStderr(text));
  td.replace(console, "log", (text) => appendStdout(text + "\n"));
  td.replace(console, "warn", (text) => appendStderr(text + "\n"));
  td.replace(console, "error", (text) => appendStderr(text + "\n"));
  td.replace(Date, "now", () => 0);

  const write = [];

  td.replace(fs.promises, "writeFile", async (filename, content) => {
    write.push({ filename, content });
  });

  /*
    A fake non-existing directory to test plugin search won't crash.

    See:
    - `isDirectory` function in `src/common/load-plugins.js`
    - Test file `./__tests__/plugin-virtual-directory.js`
    - Pull request #5819
  */
  const originalStatSync = fs.statSync;
  td.replace(fs, "statSync", (filename) =>
    originalStatSync(
      path.basename(filename) === "virtualDirectory" ? __filename : filename
    )
  );

  const originalCwd = process.cwd();
  const originalArgv = process.argv;
  const originalExitCode = process.exitCode;
  const originalStdinIsTTY = process.stdin.isTTY;
  const originalStdoutIsTTY = process.stdout.isTTY;

  process.chdir(normalizeDir(dir));
  process.stdin.isTTY = Boolean(options.isTTY);
  process.stdout.isTTY = Boolean(options.stdoutIsTTY);
  process.argv = ["path/to/node", "path/to/prettier/bin", ...args];

  // We cannot use `jest.setMock("get-stream", impl)` here, because in the
  // production build everything is bundled into one file so there is no
  // "get-stream" module to mock.
  td.replace(require(thirdParty), "getStdin", async () => options.input || "");
  td.replace(
    require(thirdParty),
    "isCI",
    async () => () => Boolean(options.ci)
  );
  td.replace(require(thirdParty), "cosmiconfig", (moduleName, options) =>
    require("cosmiconfig").cosmiconfig(moduleName, {
      ...options,
      stopDir: path.join(__dirname, "cli"),
    })
  );
  td.replace(require(thirdParty), "cosmiconfigSync", (moduleName, options) =>
    require("cosmiconfig").cosmiconfigSync(moduleName, {
      ...options,
      stopDir: path.join(__dirname, "cli"),
    })
  );
  td.replace(require(thirdParty), "findParentDir", () => process.cwd());

  try {
    // const { promise } = await import(url.pathToFileURL(prettierCli));
    const { promise } = require(prettierCli);
    await promise;
    status = (status === undefined ? process.exitCode : status) || 0;
  } catch (error) {
    status = 1;
    stderr += error.message;
  } finally {
    process.chdir(originalCwd);
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
    process.stdin.isTTY = originalStdinIsTTY;
    process.stdout.isTTY = originalStdoutIsTTY;
    td.reset();
  }

  return { status, stdout, stderr, write };

  function appendStdout(text) {
    if (status === undefined) {
      stdout += text;
    }
  }
  function appendStderr(text) {
    if (status === undefined) {
      stderr += text;
    }
  }
}

let hasRunningCli = false;
function runPrettier(dir, args = [], options = {}) {
  let promise;
  const getters = {
    get status() {
      return runCli().then(({ status }) => status);
    },
    get stdout() {
      return runCli().then(({ stdout }) => stdout);
    },
    get stderr() {
      return runCli().then(({ stderr }) => stderr);
    },
    get write() {
      return runCli().then(({ write }) => write);
    },
    test: testResult,
    then(onFulfilled, onRejected) {
      return runCli().then(onFulfilled, onRejected);
    },
  };

  return getters;

  function runCli() {
    if (hasRunningCli) {
      throw new Error("Please wait for previous CLI to exit.");
    }

    if (!promise) {
      hasRunningCli = true;
      promise = run(dir, args, options).finally(() => {
        hasRunningCli = false;
      });
    }
    return promise;
  }

  function testResult(testOptions) {
    for (const name of ["status", "stdout", "stderr", "write"]) {
      it(`(${name})`, async () => {
        const result = await runCli();
        const value =
          // \r is trimmed from jest snapshots by default;
          // manually replacing this character with /*CR*/ to test its true presence
          // If ignoreLineEndings is specified, \r is simply deleted instead
          typeof result[name] === "string"
            ? options.ignoreLineEndings
              ? stripAnsi(result[name]).replace(/\r/g, "")
              : stripAnsi(result[name]).replace(/\r/g, "/*CR*/")
            : result[name];
        if (name in testOptions) {
          if (name === "status" && testOptions[name] === "non-zero") {
            expect(value).to.not.equal(0);
          } else {
            expect(value).to.deep.equal(testOptions[name]);
          }
        } else {
          // console.log({ name, testOptions, result });
          expect(value).to.matchSnapshot();
        }
      });
    }

    return getters;
  }
}

function normalizeDir(dir) {
  const isRelative = dir[0] !== "/";
  return isRelative ? path.resolve(__dirname, dir) : dir;
}

export default runPrettier;
