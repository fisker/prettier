import path from "node:path";
import loader from "./load-config.js";
import Resolver from "./resolver.js";
import { CONFIG_FILE_NAMES } from "./common.js";

const resolver = new Resolver({
  loader,
  searchPlaces: CONFIG_FILE_NAMES,
});

/**
 * @typedef {Object} ConfigResult
 * @property {Object?} config - The loaded configuration.
 * @property {string} configFile - The path to the configuration file.
 */

/**
 * Loads the configuration from the specified file.
 *
 * @param {string} configFile - The path to the configuration file.
 * @param {{ cache?: boolean }} options - Additional options for loading the configuration (optional).
 * @returns {Promise<ConfigResult>} - A promise that resolves to an object containing the loaded configuration and the path to the configuration file.
 */
async function load(configFile, options) {
  configFile = path.resolve(configFile);

  const config = await resolver.load(configFile, options);
  return { config, configFile };
}

/**
 * Searches for a configuration file in the specified directory.
 * 
 * @param {string} directory - The directory to search in.
 * @param {Object} options - The search options.
 * @returns {Promise<ConfigResult | undefined>} - A promise that resolves to an object containing the loaded configuration and the path to the configuration file.
 */
async function search(directory, options) {
  const configFile = await resolver.search(directory, options);

  if (!configFile) {
    return;
  }

  const config = await resolver.load(configFile, options);
  return { config, configFile };
}

/**
 * Clears the cache used by the searcher.
 */
function clearCache() {
  resolver.clearCache();
}

export { load, search, clearCache };
