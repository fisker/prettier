import fs from "node:fs/promises";
import getStdin from "get-stdin";
import { isCI } from "ci-info";
import {
  load,
  search,
  clearCache,
} from "../config/prettier-config-explorer/index.js";

function writeFormattedFile(file, data) {
  return fs.writeFile(file, data);
}

const mockable = {
  loadConfig: load,
  searchConfig: search,
  clearConfigCache: clearCache,
  getStdin,
  isCI: () => isCI,
  writeFormattedFile,
};

export default mockable;
