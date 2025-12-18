import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import puppeteer from "puppeteer";
import createEsmUtils from "esm-utils";
import fastGlob from "fast-glob";

const { dirname, __dirname: PROJECT_ROOT } = createEsmUtils(import.meta);
const distDirectory = process.env.PRETTIER_DIR;

// Sample of format tests to run in browser
// Cover major parsers and file types
const BROWSER_FORMAT_TESTS = [
  // JavaScript/Babel
  {
    name: "js/arrows/block_like.js",
    parser: "babel",
    options: { arrowParens: "always" },
  },
  {
    name: "js/arrows/array-and-object.js",
    parser: "babel",
    options: { arrowParens: "always" },
  },
  {
    name: "js/async/async-iteration.js",
    parser: "babel",
    options: {},
  },
  // TypeScript
  {
    name: "typescript/export-default/function_as.ts",
    parser: "typescript",
    options: {},
  },
  {
    name: "typescript/arrow/arrow_regression.ts",
    parser: "typescript",
    options: {},
  },
  // JSON
  {
    name: "misc/insert-pragma/json/does-nothing.json",
    parser: "json",
    options: {},
  },
  // CSS
  {
    name: "css/atrule/charset.css",
    parser: "css",
    options: {},
  },
  // Markdown
  {
    name: "markdown/break/simple.md",
    parser: "markdown",
    options: {},
  },
  // HTML
  {
    name: "html/basics/comment.html",
    parser: "html",
    options: {},
  },
];

describe("Browser Format Tests", () => {
  let browser;
  let page;
  let server;
  let serverUrl;
  const formatTestsDir = path.join(PROJECT_ROOT, "..", "..", "format");

  beforeAll(async () => {
    // Launch puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      executablePath: "/usr/bin/google-chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    // Start HTTP server to serve test files
    const port = 8766;
    serverUrl = `http://localhost:${port}`;

    server = http.createServer((req, res) => {
      // Serve the test runner HTML page
      if (req.url === "/" || req.url === "/format-test-runner.html") {
        const testPagePath = path.join(
          dirname,
          "browser",
          "format-test-runner.html",
        );
        const content = fs.readFileSync(testPagePath, "utf8");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content);
        return;
      }

      // Serve Prettier standalone bundle
      if (req.url === "/standalone.js") {
        const standalonePath = path.join(distDirectory, "standalone.js");
        const content = fs.readFileSync(standalonePath, "utf8");
        res.writeHead(200, { "Content-Type": "application/javascript" });
        res.end(content);
        return;
      }

      // Serve Prettier plugins
      if (req.url?.startsWith("/plugins/")) {
        const pluginName = req.url.replace("/plugins/", "");
        const pluginPath = path.join(distDirectory, "plugins", pluginName);
        if (fs.existsSync(pluginPath)) {
          const content = fs.readFileSync(pluginPath, "utf8");
          res.writeHead(200, { "Content-Type": "application/javascript" });
          res.end(content);
          return;
        }
      }

      res.writeHead(404);
      res.end("Not found");
    });

    await new Promise((resolve) => {
      server.listen(port, resolve);
    });

    // Create a new page and initialize it
    page = await browser.newPage();
    await page.goto(serverUrl, { waitUntil: "networkidle0" });

    // Load Prettier standalone and all plugins
    await page.addScriptTag({ url: `${serverUrl}/standalone.js` });
    await page.addScriptTag({ url: `${serverUrl}/plugins/babel.js` });
    await page.addScriptTag({ url: `${serverUrl}/plugins/estree.js` });
    await page.addScriptTag({ url: `${serverUrl}/plugins/typescript.js` });
    await page.addScriptTag({ url: `${serverUrl}/plugins/flow.js` });
    await page.addScriptTag({ url: `${serverUrl}/plugins/html.js` });
    await page.addScriptTag({ url: `${serverUrl}/plugins/markdown.js` });
    await page.addScriptTag({ url: `${serverUrl}/plugins/postcss.js` });
    await page.addScriptTag({ url: `${serverUrl}/plugins/yaml.js` });
    await page.addScriptTag({ url: `${serverUrl}/plugins/graphql.js` });
    await page.addScriptTag({ url: `${serverUrl}/plugins/angular.js` });
    await page.addScriptTag({ url: `${serverUrl}/plugins/glimmer.js` });

    // Initialize the format test runner
    await page.evaluate(() => {
      window.prettierFormatTestRunner.init(
        window.prettier,
        window.prettierPlugins,
      );
    });
  });

  afterAll(async () => {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  });

  // Run each format test
  for (const testConfig of BROWSER_FORMAT_TESTS) {
    test(`format ${testConfig.name}`, async () => {
      const testFilePath = path.join(formatTestsDir, testConfig.name);

      // Check if test file exists
      if (!fs.existsSync(testFilePath)) {
        throw new Error(`Test file not found: ${testFilePath}`);
      }

      // Read the input code
      const inputCode = fs.readFileSync(testFilePath, "utf8");

      // Format in browser
      const result = await page.evaluate(
        async (code, parser, options) => {
          return await window.prettierFormatTestRunner.format(code, {
            parser,
            ...options,
          });
        },
        inputCode,
        testConfig.parser,
        testConfig.options,
      );

      // Check for errors
      if (result.error) {
        throw new Error(
          `Format failed: ${result.error.message}\n${result.error.stack}`,
        );
      }

      // Verify the output
      expect(result.formatted).toBeDefined();
      expect(typeof result.formatted).toBe("string");

      // The most important check: verify that formatting is idempotent
      // This ensures the browser format produces stable output
      const secondFormatResult = await page.evaluate(
        async (code, parser, options) => {
          return await window.prettierFormatTestRunner.format(code, {
            parser,
            ...options,
          });
        },
        result.formatted,
        testConfig.parser,
        testConfig.options,
      );

      expect(secondFormatResult.error).toBeNull();
      expect(secondFormatResult.formatted).toBe(result.formatted);
    });
  }

  test("should handle format errors gracefully in browser", async () => {
    const invalidCode = "function test( { invalid syntax";
    const result = await page.evaluate(async (code) => {
      return await window.prettierFormatTestRunner.format(code, {
        parser: "babel",
      });
    }, invalidCode);

    expect(result.error).not.toBeNull();
    expect(result.error.message).toBeTruthy();
    expect(result.formatted).toBeNull();
  });
});
