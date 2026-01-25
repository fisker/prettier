import assert from "node:assert/strict";
import { chromium, firefox, webkit } from "playwright";
import { registry } from "playwright-core/lib/server/registry/index";

// Map test browser names to Playwright browser types
function getBrowserType(browserName) {
  // Playwright-installed browsers (via npx playwright install)
  if (browserName === "chromium") {
    return "chromium";
  }
  if (browserName === "chrome-for-testing") {
    return "chrome-for-testing";
  }
  if (browserName === "firefox") {
    return "firefox";
  }
  if (browserName === "webkit" || browserName === "safari") {
    return "webkit";
  }
  
  // System-installed Chrome channel variants
  if (browserName === "chrome") {
    return "chrome";
  }
  if (browserName === "chrome-beta") {
    return "chrome-beta";
  }
  if (browserName === "chrome-dev") {
    return "chrome-dev";
  }
  if (browserName === "chrome-canary") {
    return "chrome-canary";
  }
  
  // System-installed Edge channel variants
  if (browserName === "msedge" || browserName === "edge") {
    return "msedge";
  }
  if (browserName === "msedge-beta") {
    return "msedge-beta";
  }
  if (browserName === "msedge-dev") {
    return "msedge-dev";
  }
  if (browserName === "msedge-canary") {
    return "msedge-canary";
  }
  
  // System-installed Firefox channel variants
  if (browserName === "firefox-beta") {
    return "firefox-beta";
  }
  
  throw new Error(
    `Unsupported browser: ${browserName}. Supported browsers: chromium, chrome-for-testing, firefox, firefox-beta, webkit, chrome, chrome-beta, chrome-dev, chrome-canary, msedge, msedge-beta, msedge-dev, msedge-canary`,
  );
}

// Get Playwright browser instance for launching
function getPlaywrightBrowser(browserName) {
  const browserType = getBrowserType(browserName);
  
  // Firefox and WebKit use their own browser types
  if (browserType === "firefox" || browserType === "firefox-beta") {
    return firefox;
  }
  if (browserType === "webkit") {
    return webkit;
  }
  
  // All Chromium-based browsers (including Chrome, Edge channels, and chrome-for-testing) use chromium
  return chromium;
}

// Get launch options for browser
function getLaunchOptions(browserName) {
  const browserType = getBrowserType(browserName);
  const options = {
    headless: true,
  };
  
  // Channel-based browsers (Chrome, Edge, and Firefox variants)
  const channelBrowsers = [
    "chrome",
    "chrome-beta",
    "chrome-dev",
    "chrome-canary",
    "msedge",
    "msedge-beta",
    "msedge-dev",
    "msedge-canary",
    "firefox-beta",
  ];
  
  if (channelBrowsers.includes(browserType)) {
    options.channel = browserType;
  }
  
  return options;
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
  const launchOptions = getLaunchOptions(browserName);
  const playwrightBrowserName = getBrowserType(browserName);

  let browser;
  try {
    browser = await browserType.launch(launchOptions);
  } catch (error) {
    // Provide helpful error message if browser is not installed
    if (error.message?.includes("Executable doesn't exist")) {
      // Channel-based browsers need system installation
      const channelBrowsers = [
        "chrome",
        "chrome-beta",
        "chrome-dev",
        "chrome-canary",
        "msedge",
        "msedge-beta",
        "msedge-dev",
        "msedge-canary",
        "firefox-beta",
      ];
      
      if (channelBrowsers.includes(playwrightBrowserName)) {
        const installUrls = {
          chrome: "https://www.google.com/chrome",
          "chrome-beta": "https://www.google.com/chrome/beta",
          "chrome-dev": "https://www.google.com/chrome/dev",
          "chrome-canary": "https://www.google.com/chrome/canary",
          msedge: "https://www.microsoft.com/edge",
          "msedge-beta": "https://www.microsoft.com/edge/download/insider",
          "msedge-dev": "https://www.microsoft.com/edge/download/insider",
          "msedge-canary": "https://www.microsoft.com/edge/download/insider",
          "firefox-beta": "https://www.mozilla.org/firefox/channel/desktop/#beta",
        };
        throw new Error(
          `${playwrightBrowserName} not found. Please install from ${installUrls[playwrightBrowserName]}`,
        );
      }
      
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
    
    // Attach browser metadata for assertions
    browser._browserInfo = {
      name: browserName,
      type: playwrightBrowserName,
      version,
      // Determine browser family for easier assertions
      family: playwrightBrowserName === "firefox" || playwrightBrowserName === "firefox-beta" ? "firefox" 
            : playwrightBrowserName === "webkit" ? "webkit"
            : "chromium", // All Chrome/Edge variants are chromium-based
    };
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
  
  // Channel-based browsers need system installation
  const channelBrowsers = [
    "chrome",
    "chrome-beta",
    "chrome-dev",
    "chrome-canary",
    "msedge",
    "msedge-beta",
    "msedge-dev",
    "msedge-canary",
    "firefox-beta",
  ];
  
  if (channelBrowsers.includes(playwrightBrowserName)) {
    const installUrls = {
      chrome: "https://www.google.com/chrome",
      "chrome-beta": "https://www.google.com/chrome/beta",
      "chrome-dev": "https://www.google.com/chrome/dev",
      "chrome-canary": "https://www.google.com/chrome/canary",
      msedge: "https://www.microsoft.com/edge",
      "msedge-beta": "https://www.microsoft.com/edge/download/insider",
      "msedge-dev": "https://www.microsoft.com/edge/download/insider",
      "msedge-canary": "https://www.microsoft.com/edge/download/insider",
      "firefox-beta": "https://www.mozilla.org/firefox/channel/desktop/#beta",
    };
    throw new Error(
      `${playwrightBrowserName} not found. Please install from ${installUrls[playwrightBrowserName]}`,
    );
  }
  
  // Use Playwright's internal installation API (same as @playwright/test)
  // This downloads browsers without using child_process
  await downloadBrowser({ browser });
}

// Download browser using Playwright's registry API
async function downloadBrowser({ browser }) {
  const playwrightBrowserName = getBrowserType(browser);
  
  // Check if download is skipped
  if (process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === "1") {
    console.log("Skipping browser download because PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD is set");
    return;
  }
  
  // Use registry API directly to install the browser
  // This is what installBrowsersForNpmInstall does internally
  const executable = registry.findExecutable(playwrightBrowserName);
  if (!executable || executable.installType === "none") {
    throw new Error(`Cannot install ${playwrightBrowserName}`);
  }
  
  const executables = [executable];
  
  // Chromium needs chromium-headless-shell
  if (playwrightBrowserName === "chromium") {
    const headlessShell = registry.findExecutable("chromium-headless-shell");
    if (headlessShell) {
      executables.push(headlessShell);
    }
  }
  
  // Add winldd on Windows
  if (process.platform === "win32") {
    const winldd = registry.findExecutable("winldd");
    if (winldd) {
      executables.push(winldd);
    }
  }
  
  // Install browsers without spawning child processes
  await registry.install(executables, false);
}

// Get browser information from a launched browser instance
function getBrowserInfo(browser) {
  return browser._browserInfo || null;
}

export {
  downloadBrowser,
  installBrowser,
  isBrowserInstalled,
  launchBrowser,
  getBrowserInfo,
};
