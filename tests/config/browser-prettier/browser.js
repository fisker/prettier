import assert from "node:assert/strict";
import { chromium, firefox } from "playwright";

async function downloadBrowser({ browser }) {
  // Playwright's install command
  const { execSync } = await import("node:child_process");
  const browserType = browser === "chrome" ? "chromium" : browser;
  
  // Validate browser type to prevent command injection
  const allowedBrowsers = ["chromium", "firefox"];
  if (!allowedBrowsers.includes(browserType)) {
    throw new Error(`Unsupported browser: ${browser}. Supported browsers: chrome, firefox`);
  }
  
  try {
    execSync(`npx playwright install ${browserType}`, {
      stdio: "inherit",
      env: { ...process.env, npm_config_loglevel: "silent" },
    });
  } catch (error) {
    console.error(`Failed to install ${browserType}:`, error.message);
    throw error;
  }
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
  // Map browser names to Playwright browser types
  let browserType;
  if (browserName === "chrome") {
    browserType = chromium;
  } else if (browserName === "firefox") {
    browserType = firefox;
  } else {
    throw new Error(`Unsupported browser: ${browserName}. Supported browsers: chrome, firefox`);
  }
  
  const browser = await browserType.launch({
    headless: true,
  });

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
