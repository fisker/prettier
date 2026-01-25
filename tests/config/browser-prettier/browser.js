import assert from "node:assert/strict";
import { chromium, firefox, webkit } from "playwright";

// Map test browser names to Playwright browser types
function getBrowserType(browserName) {
  if (browserName === "chrome") {
    return "chromium";
  }
  if (browserName === "firefox") {
    return "firefox";
  }
  if (browserName === "webkit" || browserName === "safari") {
    return "webkit";
  }
  throw new Error(
    `Unsupported browser: ${browserName}. Supported browsers: chrome, firefox, webkit (safari)`,
  );
}

// Get Playwright browser instance for launching
function getPlaywrightBrowser(browserName) {
  const browserType = getBrowserType(browserName);
  if (browserType === "chromium") {
    return chromium;
  }
  if (browserType === "firefox") {
    return firefox;
  }
  if (browserType === "webkit") {
    return webkit;
  }
  throw new Error(`Unknown browser type: ${browserType}`);
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

  const playwrightBrowserName = getBrowserType(browser);
  throw new Error(
    `Browser not installed. Please run: npx playwright install ${playwrightBrowserName}`,
  );
}

// Deprecated: kept for compatibility but no longer downloads browsers
async function downloadBrowser({ browser }) {
  await installBrowser({ browser });
}

export { downloadBrowser, installBrowser, isBrowserInstalled, launchBrowser };
