import assert from "node:assert/strict";
import { chromium, firefox } from "playwright";

// Map test browser names to Playwright browser types
function getBrowserType(browserName) {
  if (browserName === "chrome") {
    return "chromium";
  }
  if (browserName === "firefox") {
    return "firefox";
  }
  throw new Error(
    `Unsupported browser: ${browserName}. Supported browsers: chrome, firefox`,
  );
}

// Get Playwright browser instance for launching
function getPlaywrightBrowser(browserName) {
  const browserType = getBrowserType(browserName);
  return browserType === "chromium" ? chromium : firefox;
}

async function downloadBrowser({ browser }) {
  const playwrightBrowserName = getBrowserType(browser);

  // Use Node's spawn to run playwright CLI without shell
  const { spawn } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const { dirname, join } = await import("node:path");

  // Get path to playwright CLI
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const playwrightCliPath = join(
    __dirname,
    "../../../node_modules/playwright/cli.js",
  );

  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath, // Use node executable
      [playwrightCliPath, "install", playwrightBrowserName],
      {
        stdio: "inherit",
        env: { ...process.env, npm_config_loglevel: "silent" },
      },
    );

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`Failed to install ${playwrightBrowserName}: exit code ${code}`),
        );
      }
    });

    child.on("error", (error) => {
      reject(
        new Error(`Failed to install ${playwrightBrowserName}: ${error.message}`),
      );
    });
  });
}

async function isBrowserInstalled({ browser: browserName }) {
  try {
    const browser = await launchBrowser({ browser: browserName });
    await browser.close();
    return true;
  } catch {
    // Noop
  }

  return false;
}

async function launchBrowser({ browser: browserName }) {
  const browserType = getPlaywrightBrowser(browserName);

  let browser;
  try {
    browser = await browserType.launch({
      headless: true,
    });
  } catch (error) {
    // Provide helpful error message if browser is not installed
    if (error.message?.includes("Executable doesn't exist")) {
      const playwrightBrowserName = getBrowserType(browserName);
      throw new Error(
        `Browser not installed. Please run: npx playwright install ${playwrightBrowserName}`,
      );
    }
    throw error;
  }

  try {
    const version = await browser.version();
    // Playwright returns just the version number (e.g., "131.0.6778.33" or "132.0")
    // Just verify that we got a version string
    assert.ok(version && typeof version === "string" && version.length > 0);
  } catch (error) {
    await browser.close();
    throw error;
  }

  return browser;
}

async function installBrowser({ browser }) {
  if (await isBrowserInstalled({ browser })) {
    return;
  }

  await downloadBrowser({ browser });
}

export { downloadBrowser, installBrowser, isBrowserInstalled, launchBrowser };
