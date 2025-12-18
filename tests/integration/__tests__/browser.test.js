import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import puppeteer from "puppeteer";
import createEsmUtils from "esm-utils";

const { dirname } = createEsmUtils(import.meta);
const distDirectory = process.env.PRETTIER_DIR;

describe("Browser", () => {
  let browser;
  let page;
  let server;
  let serverUrl;

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
    const port = 8765;
    serverUrl = `http://localhost:${port}`;

    server = http.createServer((req, res) => {
      // Serve the test HTML page
      if (req.url === "/" || req.url === "/test-page.html") {
        const testPagePath = path.join(dirname, "browser", "test-page.html");
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
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test("should load Prettier standalone in browser and format code", async () => {
    // Navigate to the test page served via HTTP
    await page.goto(serverUrl, { waitUntil: "networkidle0" });

    // Load Prettier standalone bundle from server
    await page.addScriptTag({ url: `${serverUrl}/standalone.js` });

    // Load Prettier plugins from server
    await page.addScriptTag({ url: `${serverUrl}/plugins/babel.js` });
    await page.addScriptTag({ url: `${serverUrl}/plugins/estree.js` });

    // Verify Prettier is loaded
    const prettierLoaded = await page.evaluate(() => window.prettierLoaded);
    expect(prettierLoaded).toBe(false); // Initially false before we loaded it

    // Check that prettier is now available
    const hasPrettier = await page.evaluate(
      () => typeof window.prettier !== "undefined",
    );
    expect(hasPrettier).toBe(true);

    // Run the test
    const result = await page.evaluate(() => window.runPrettierTest());

    // Verify the formatting worked
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.output).toContain("function hello()");
    expect(result.output).toContain('console.log("world")');
    expect(result.output).not.toBe(result.input);
  });

  test("should expose prettier API in browser", async () => {
    await page.goto(serverUrl, { waitUntil: "networkidle0" });

    // Load Prettier standalone from server
    await page.addScriptTag({ url: `${serverUrl}/standalone.js` });

    // Check API availability
    const api = await page.evaluate(() => {
      return {
        hasPrettier: typeof window.prettier !== "undefined",
        hasFormat: typeof window.prettier?.format === "function",
        hasFormatWithCursor:
          typeof window.prettier?.formatWithCursor === "function",
        hasCheck: typeof window.prettier?.check === "function",
        hasGetSupportInfo:
          typeof window.prettier?.getSupportInfo === "function",
      };
    });

    expect(api.hasPrettier).toBe(true);
    expect(api.hasFormat).toBe(true);
    expect(api.hasFormatWithCursor).toBe(true);
    expect(api.hasCheck).toBe(true);
    expect(api.hasGetSupportInfo).toBe(true);
  });
});
