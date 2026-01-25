import { defineConfig } from "playwright";
import path from "node:path";

const IS_CI = Boolean(process.env.CI);

export default defineConfig({
  // Store browser binaries in .tmp/playwright/ for CI
  ...(IS_CI && {
    use: {
      cacheDirectory: path.join(process.cwd(), "./.tmp/playwright/"),
    },
  }),
});
