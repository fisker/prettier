/**
 * Browser-based format test runner
 * This extends the regular format test to also run in a real browser
 */

import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer";
import createEsmUtils from "esm-utils";

const { __dirname } = createEsmUtils(import.meta);
const distDirectory = process.env.PRETTIER_DIR;

// Global browser instance and server
let browserInstance = null;
let serverInstance = null;
let serverPort = null;
let prettierForNode = null;
let pluginsForNode = {};

// Initialize browser and server once for all tests
export async function setupBrowserTest() {
  if (browserInstance) {
    return { browser: browserInstance, port: serverPort };
  }

  // Load Prettier for Node.js (from dist)
  const standalonePath = path.join(distDirectory, "standalone.mjs");
  const prettierModule = await import(pathToFileURL(standalonePath));
  prettierForNode = prettierModule.default || prettierModule;

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
  for (const pluginName of pluginsToLoad) {
    const pluginPath = path.join(distDirectory, "plugins", `${pluginName}.mjs`);
    const plugin = await import(pathToFileURL(pluginPath));
    pluginsForNode[pluginName] = plugin.default || plugin;
  }

  // Start HTTP server
  const port = 8765;
  const server = http.createServer((req, res) => {
    // Serve the test runner HTML page
    if (req.url === "/" || req.url === "/test-runner.html") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Format Test Runner</title></head>
<body>
<h1>Format Test Runner</h1>
<script>
  window.formatTestRunner = {
    async format(code, options, pluginNames) {
      try {
        const plugins = [];
        for (const name of pluginNames) {
          if (window.prettierPlugins[name]) {
            plugins.push(window.prettierPlugins[name]);
          }
        }
        const formatted = await window.prettier.format(code, { ...options, plugins });
        return { formatted, error: null };
      } catch (error) {
        return { formatted: null, error: { message: error.message, name: error.name } };
      }
    }
  };
</script>
</body>
</html>`);
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

  serverInstance = server;
  serverPort = port;

  // Launch browser
  browserInstance = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  // Create a page and load Prettier
  const page = await browserInstance.newPage();
  await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle0" });

  // Load Prettier standalone and all plugins
  await page.addScriptTag({ url: `http://localhost:${port}/standalone.js` });
  await page.addScriptTag({ url: `http://localhost:${port}/plugins/babel.js` });
  await page.addScriptTag({ url: `http://localhost:${port}/plugins/estree.js` });
  await page.addScriptTag({ url: `http://localhost:${port}/plugins/typescript.js` });
  await page.addScriptTag({ url: `http://localhost:${port}/plugins/flow.js` });
  await page.addScriptTag({ url: `http://localhost:${port}/plugins/html.js` });
  await page.addScriptTag({ url: `http://localhost:${port}/plugins/markdown.js` });
  await page.addScriptTag({ url: `http://localhost:${port}/plugins/postcss.js` });
  await page.addScriptTag({ url: `http://localhost:${port}/plugins/yaml.js` });
  await page.addScriptTag({ url: `http://localhost:${port}/plugins/graphql.js` });
  await page.addScriptTag({ url: `http://localhost:${port}/plugins/angular.js` });
  await page.addScriptTag({ url: `http://localhost:${port}/plugins/glimmer.js` });

  await page.close();

  return { browser: browserInstance, port: serverPort };
}

export async function teardownBrowserTest() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
  if (serverInstance) {
    await new Promise((resolve) => {
      serverInstance.close(resolve);
    });
    serverInstance = null;
  }
}

// Format code in browser and compare with Node.js output
export async function formatInBrowser(code, options) {
  const { browser, port } = await setupBrowserTest();

  // Map parser to required plugins
  const parserPluginMap = {
    babel: ["babel", "estree"],
    flow: ["flow", "estree"],
    typescript: ["typescript", "estree"],
    "babel-ts": ["babel", "estree"],
    "babel-flow": ["babel", "estree"],
    json: ["babel", "estree"],
    json5: ["babel", "estree"],
    "json-stringify": ["babel", "estree"],
    css: ["postcss"],
    less: ["postcss"],
    scss: ["postcss"],
    html: ["html"],
    vue: ["html"],
    angular: ["angular", "html"],
    markdown: ["markdown"],
    mdx: ["mdx"],
    yaml: ["yaml"],
    graphql: ["graphql"],
    glimmer: ["glimmer"],
  };

  const requiredPluginNames = parserPluginMap[options.parser] || [options.parser];
  const nodePlugins = requiredPluginNames.map((name) => pluginsForNode[name]).filter(Boolean);

  // Format in Node.js for comparison
  let nodeOutput;
  let nodeError = null;
  try {
    nodeOutput = await prettierForNode.format(code, { ...options, plugins: nodePlugins });
  } catch (error) {
    nodeError = error;
  }

  // Format in browser
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle0" });

  // Load Prettier and plugins
  await page.addScriptTag({ url: `http://localhost:${port}/standalone.js` });
  for (const pluginName of requiredPluginNames) {
    await page.addScriptTag({ url: `http://localhost:${port}/plugins/${pluginName}.js` });
  }

  const browserResult = await page.evaluate(
    async (inputCode, formatOptions, pluginNames) => {
      return await window.formatTestRunner.format(inputCode, formatOptions, pluginNames);
    },
    code,
    options,
    requiredPluginNames,
  );

  await page.close();

  return {
    nodeOutput,
    nodeError,
    browserOutput: browserResult.formatted,
    browserError: browserResult.error,
  };
}
