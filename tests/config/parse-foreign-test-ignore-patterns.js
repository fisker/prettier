import fs from "node:fs";

const ROOT_DIR_PREFIX = "<rootDir>/";

function* parseForeignTestIgnorePatterns(file) {
  if (!fs.existsSync(file)) {
    return;
  }

  let ignoreContent = "";
  try {
    ignoreContent = fs.readFileSync(file);
  } catch {
    return;
  }

  for (let pattern of ignoreContent.split("\n")) {
    pattern = pattern.trim();
    if (pattern.startsWith(ROOT_DIR_PREFIX)) {
      pattern = pattern.slice(ROOT_DIR_PREFIX.length);
    }

    if (!pattern.startsWith("tests/")) {
      continue;
    }

    yield ROOT_DIR_PREFIX + pattern;
  }
}

export default parseForeignTestIgnorePatterns;
