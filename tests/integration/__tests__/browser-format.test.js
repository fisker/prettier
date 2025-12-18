import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer";
import createEsmUtils from "esm-utils";

const { dirname, __dirname: PROJECT_ROOT } = createEsmUtils(import.meta);
const distDirectory = process.env.PRETTIER_DIR;

// Import Prettier from dist for Node.js comparison
let prettier;
let prettierPlugins;

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
    // Load Prettier for Node.js (from dist)
    const standalonePath = path.join(distDirectory, "standalone.mjs");
    const prettierModule = await import(pathToFileURL(standalonePath));
    prettier = prettierModule.default || prettierModule;

    // Load plugins for Node.js
    const pluginsToLoad = [
      "babel",
      "estree",
      "typescript",
      "flow",
      "html",
      "markdown",
      "postcss",
      "yaml",
      "graphql",
      "angular",
      "glimmer",
    ];
    prettierPlugins = {};
    for (const pluginName of pluginsToLoad) {
      const pluginPath = path.join(
        distDirectory,
        "plugins",
        `${pluginName}.mjs`,
      );
      const plugin = await import(pathToFileURL(pluginPath));
      prettierPlugins[pluginName] = plugin.default || plugin;
    }

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

      // Map parser to required plugins
      const parserPluginMap = {
        babel: ["babel", "estree"],
        flow: ["flow", "estree"],
        typescript: ["typescript", "estree"],
        json: ["babel", "estree"],
        css: ["postcss"],
        less: ["postcss"],
        scss: ["postcss"],
        html: ["html"],
        markdown: ["markdown"],
        yaml: ["yaml"],
        graphql: ["graphql"],
      };

      const requiredPluginNames =
        parserPluginMap[testConfig.parser] || [testConfig.parser];
      const nodePlugins = requiredPluginNames.map(
        (name) => prettierPlugins[name],
      );

      // Format in Node.js (expected output)
      const nodeFormatOptions = {
        parser: testConfig.parser,
        ...testConfig.options,
        plugins: nodePlugins,
      };
      const nodeOutput = await prettier.format(inputCode, nodeFormatOptions);

      // Format in browser
      const browserResult = await page.evaluate(
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

      // Assertions done in Node.js
      expect(browserResult.error).toBeNull();
      expect(browserResult.formatted).toBeDefined();
      expect(typeof browserResult.formatted).toBe("string");

      // The browser output should match the Node.js output exactly
      expect(browserResult.formatted).toBe(nodeOutput);

      // Verify idempotency in browser: format twice should give same result
      const browserSecondResult = await page.evaluate(
        async (code, parser, options) => {
          return await window.prettierFormatTestRunner.format(code, {
            parser,
            ...options,
          });
        },
        browserResult.formatted,
        testConfig.parser,
        testConfig.options,
      );

      expect(browserSecondResult.error).toBeNull();
      expect(browserSecondResult.formatted).toBe(browserResult.formatted);
    });
  }

  test("should handle format errors gracefully in browser", async () => {
    const invalidCode = "function test( { invalid syntax";

    // Call browser format (which should fail)
    const browserResult = await page.evaluate(async (code) => {
      return await window.prettierFormatTestRunner.format(code, {
        parser: "babel",
      });
    }, invalidCode);

    // Assertions done in Node.js
    expect(browserResult.error).not.toBeNull();
    expect(browserResult.error.message).toBeTruthy();
    expect(browserResult.formatted).toBeNull();

    // Verify Node.js also errors on this code (behavior should match)
    await expect(
      prettier.format(invalidCode, {
        parser: "babel",
        plugins: [prettierPlugins.babel, prettierPlugins.estree],
      }),
    ).rejects.toThrow();
  });
});
