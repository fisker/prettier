import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import jsonfile from "jsonfile";

const toPath = (path) => (path instanceof URL ? url.fileURLToPath(path) : path);

function readJson(file) {
  return jsonfile.readFile(toPath(file));
}

function writeJson(file, content) {
  return jsonfile.writeFile(toPath(file), content, { spaces: 2 });
}

async function copyFile(from, to) {
  await createDirectory(path.dirname(toPath(to)));
  return fs.copyFile(from, to);
}

async function createDirectory(directory) {
  try {
    await fs.mkdir(directory, { recursive: true });
  } catch {
    // noop
  }
}

async function writeFile(file, content) {
  await createDirectory(path.dirname(toPath(file)));
  return fs.writeFile(file, content);
}

const PROJECT_ROOT = url.fileURLToPath(new URL("../../", import.meta.url));
const DIST_DIR = path.join(PROJECT_ROOT, "dist");
const WEBSITE_DIR = path.join(PROJECT_ROOT, "website");
const SOURCE_DIR = path.join(PROJECT_ROOT, "src");
const PRODUCTION_MINIMAL_NODE_JS_VERSION = "14";

export {
  copyFile,
  DIST_DIR,
  PRODUCTION_MINIMAL_NODE_JS_VERSION,
  PROJECT_ROOT,
  readJson,
  SOURCE_DIR,
  WEBSITE_DIR,
  writeFile,
  writeJson,
};
