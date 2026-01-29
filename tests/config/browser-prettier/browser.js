import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

// We need load `playwright-core/lib/server/registry/index` before any other entries
// Otherwise there is no way to set install directory
const playwrightInstallDirectory = fileURLToPath(
  new URL("../../../.tmp/playwright/", import.meta.url),
);
const called = false;
async function setRegistryDirectory() {
  if (called) {
    return;
  }

  const PLAYWRIGHT_BROWSERS_PATH_BACKUP = process.env.PLAYWRIGHT_BROWSERS_PATH;
  process.env.PLAYWRIGHT_BROWSERS_PATH = playwrightInstallDirectory;

  let registry;
  try {
    registry = await import("playwright-core/lib/server/registry/index");
  } finally {
    if (PLAYWRIGHT_BROWSERS_PATH_BACKUP === undefined) {
      delete process.env.PLAYWRIGHT_BROWSERS_PATH_BACKUP;
    } else {
      process.env.PLAYWRIGHT_BROWSERS_PATH_BACKUP =
        PLAYWRIGHT_BROWSERS_PATH_BACKUP;
    }
  }
  assert.equal(registry.registryDirectory, playwrightInstallDirectory);
}

async function importPlaywrightModule(source) {
  await setRegistryDirectory();
  return import(source);
}

async function isBrowserInstalled({ browser: browserName }) {
  return false;
}

const browsers = new Map([
  [
    "chrome",
    {
      browserType: "chromium",
      userAgent: "HeadlessChrome/",
      executables: ["chromium-headless-shell"],
    },
  ],
  [
    "chromium",
    {
      browserType: "chromium",
      userAgent: "HeadlessChrome/",
    },
  ],
  ["webkit", { browserType: "webkit", userAgent: "webkit" }],
  ["firefox", { browserType: "firefox", userAgent: "Firefox" }],
]);

/**
@param {{browserName: "chromium" | "firefox" | "webkit"}} param0
*/
async function launchBrowser({ browser: browserName }) {
  const settings = browsers.get(browserName);

  const playwright = await importPlaywrightModule("playwright-core");
  /** @type {import("playwright").BrowserType} */
  const browserType = playwright[settings.browserType];
  const browser = await browserType.launch(settings.options);

  try {
    const page = await browser.newPage();
    const userAgent = await page.evaluate("navigator.userAgent");
    await page.close();
    assert.ok(userAgent.includes(` ${settings.userAgent}/`));
  } catch (error) {
    await browser.close();
    throw error;
  }

  return browser;
}

// https://github.com/microsoft/playwright/blob/dfb228e5b92b93c21598ba38200d0e5b60b76e7c/packages/playwright-core/src/server/registry/index.ts#L1492
async function installBrowser({ browser }) {
  const { registry } = await importPlaywrightModule(
    "playwright-core/lib/server/registry/index",
  );

  const settings = browsers.get(browser);

  const executables = [
    process.platform === "win32" ? "winldd" : undefined,
    ...(settings.executables ?? []),
    browser,
  ].filter(Boolean);

  await registry.install(
    executables.map((executable) => registry.findExecutable(executable)),
    false,
  );
}

export {
  installBrowser as downloadBrowser,
  installBrowser,
  isBrowserInstalled,
  launchBrowser,
};
