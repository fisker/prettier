import path from "node:path";
import iterateDirectoryUp from "iterate-directory-up";
import { readJson } from "./loaders.js";
import { fileExists } from "./common.js";

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
 * @param {string[]} configFileNames - The names of the configuration files to search for.
 * @returns {Promise<string|null>} - The path of the configuration file if found, otherwise null.
 */
async function searchConfigInDirectory(directory, configFileNames) {
  for (const fileName of configFileNames) {
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

  return null;
}

class Resolver {
  /** @type {string[]} */
  #searchPlaces;

  /** @type {(configFile: string) => Promise<any>} */
  #loader;

  /** @type {Map<string, string | null>} */
  #searchCache = new Map();

  /** @type {Map<string, Promise<any>>} */
  #loadCache = new Map();

  constructor({ loader, searchPlaces }) {
    this.#loader = loader;
    this.#searchPlaces = searchPlaces;
  }

  /**
   * Searches for a configuration file starting from a specified directory.
   *
   * @param {string} startDirectory - The directory to start the search from.
   * @param {{cache?: boolean, stopDirectory?: string}} [options={}] - The options to use.
   * @returns {Promise<string|null>} - A promise that resolves to the path of the found configuration file, or null if not found.
   */
  async search(startDirectory, options = {}) {
    const { cache, stopDirectory } = options;

    let configFile = null;

    for (const directory of iterateDirectoryUp(startDirectory, stopDirectory)) {
      // If cache is enabled and the directory is cached, use the cached result.
      if (cache && this.#searchCache.has(directory)) {
        configFile = this.#searchCache.get(directory);

        // If the cached result is null, continue searching.
        if (configFile) {
          break;
        } else {
          continue;
        }
      }

      configFile = await searchConfigInDirectory(directory, this.#searchPlaces);

      if (cache) {
        this.#searchCache.set(directory, configFile);
      }
      
      if (configFile) {
        break;
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
