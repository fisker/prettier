import path from "node:path";
import iterateDirectoryUp from "iterate-directory-up";
import {
  CONFIG_FILE_NAMES,
  fileExists,
} from "./common.js";
import { readJson } from "./loaders.js";

async function isPackageJsonFileWithPrettierConfig(file) {
  let packageJson;

  try {
    packageJson = await readJson(file);
  } catch {
    // No op
  }

  return Boolean(packageJson?.prettier);
}

/**
 * Searches for a configuration file in the specified directory.
 * 
 * @param {string} directory - The directory to search in.
 * @returns {Promise<string|undefined>} - The path of the configuration file if found, otherwise undefined.
 */
async function searchConfigInDirectory(directory) {
  for (const fileName of CONFIG_FILE_NAMES) {
    const file = path.join(directory, fileName);

    if (!(await fileExists(file))) {
      continue;
    }

    if (
      fileName !== "package.json" ||
      (await isPackageJsonFileWithPrettierConfig(file))
    ) {
      return file;
    }
  }
}

class Resolver {
  /** @type {Map<string, string>} */
  #searchCache = new Map();

  /** @type {Map<string, Promise<any>>} */
  #loadCache = new Map();

  /** @type {(configFile: string) => Promise<any>} */
  #loader;

  constructor({ loader }) {
    this.#loader = loader;
  }

  /**
   * Searches for a configuration file starting from a specified directory.
   * 
   * @param {string} startDirectory - The directory to start the search from.
   * @param {{cache?: boolean, stopDirectory?: string}} [options={}] - The options to use.
   * @returns {Promise<string|undefined>} - A promise that resolves to the path of the found configuration file, or null if not found.
   */
  async search(startDirectory, options = {}) {
    const { cache, stopDirectory } = options;

    let configFile;
    const visitedDirectories = new Set();
    
    for (const directory of iterateDirectoryUp(
      startDirectory,
      stopDirectory,
    )) {
      // If cache is enabled and the directory is cached, return the cached result.
      if (cache && this.#searchCache.has(directory)) {
        configFile = this.#searchCache.get(directory);
        break;
      }

      visitedDirectories.add(directory);

      configFile = await searchConfigInDirectory(directory);
      if (configFile) {
        break;
      }
    }

    // If cache is enabled, cache the result for all visited directories.
    if (cache) {
      for (const directory of visitedDirectories) {
        this.#searchCache.set(directory, configFile);
      }
    }

    return configFile;
  }

  /**
   * Loads the specified config file and returns a promise that resolves to the loaded file.
   * 
   * @param {string} configFile - The path to the config file.
   * @param {{ cache?: boolean }} [options={}] - The options object.
   * @returns {Promise<any>} A promise that resolves to the loaded file.
   */
  load(configFile, options = {}) {
    const { cache } = options;

    // If cache is enabled and the file is cached, return the cached result.
    if (cache && this.#loadCache.has(configFile)) {
      return this.#loadCache.get(configFile);
    }

    // Otherwise, load the file and cache the result if cache is enabled.
    const promise = this.#loader(configFile);
    if (cache) {
      this.#loadCache.set(configFile, promise);
    }

    return promise;
  }

  /**
   * Clears the cache.
   */
  clearCache() {
    this.#searchCache.clear();
    this.#loadCache.clear();
  }
}

export default Resolver;
