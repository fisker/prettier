import fs from "node:fs/promises";
import getStdin from "get-stdin";
import { isCI } from "ci-info";
import {
  createExplorer,
  clearCache,
} from "../config/prettier-config-explorer/index.js";

function writeFormattedFile(file, data) {
  return fs.writeFile(file, data);
}

const mockable = {
  createConfigExplorer: createExplorer,
  clearConfigExplorerCache: clearCache,
  getStdin,
  isCI: () => isCI,
  writeFormattedFile,
};

export default mockable;
