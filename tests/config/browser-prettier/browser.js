import assert from "node:assert/strict";
import { chromium, firefox } from "playwright";

const playwrightBrowsers = ["chrome", "firefox"];

async function downloadBrowser({ browser }) {
  // Playwright's install command
  const { execSync } = await import("node:child_process");
  const browserType = browser === "chrome" ? "chromium" : browser;
  
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
  const browserType = browserName === "chrome" ? chromium : firefox;
  
  const browser = await browserType.launch({
    headless: true,
  });

  try {
    const version = await browser.version();
    // Playwright reports chromium version for chrome
    const expectedPrefix = browserName === "chrome" ? "chromium/" : `${browserName}/`;
    assert.ok(
      version.toLowerCase().startsWith(expectedPrefix) ||
        version.toLowerCase().startsWith(browserName)
    );
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
