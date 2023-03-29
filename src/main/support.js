import arrayify from "../utils/arrayify.js";
import omit from "../utils/object-omit.js";
import { options as coreOptions } from "./core-options.evaluate.js";

/**
 * @typedef {import("./core-options.evaluate.js").OptionInfo} OptionInfo
 * @typedef {{ name: string; pluginDefaults: Array<any> } & OptionInfo} NamedOptionInfo
 */

/**
 * Strings in `plugins` and `pluginSearchDirs` are handled by a wrapped version
 * of this function created by `withPlugins`. Don't pass them here directly.
 * @param {object} param0
 * @param {(string | object)[]=} param0.plugins Strings are resolved by `withPlugins`.
 * @param {string[]=} param0.pluginSearchDirs Added by `withPlugins`.
 * @param {boolean=} param0.showDeprecated
 * @param {boolean=} param0.showInternal
 * @return {{ languages: Array<any>, options: Array<NamedOptionInfo> }}
 */
function getSupportInfo({
  plugins = [],
  showDeprecated = false,
  showInternal = false,
} = {}) {
  const languages = plugins.flatMap((plugin) => plugin.languages ?? []);

  const options = [];
  for (const originalOption of arrayify(
    Object.assign({}, ...plugins.map(({ options }) => options), coreOptions),
    "name"
  )) {
    if (!showDeprecated && originalOption.deprecated) {
      continue;
    }

    const option = showInternal
      ? { ...originalOption }
      : omit(originalOption, ["cliName", "cliCategory", "cliDescription"]);

    // This work this way because we used support `[{value: [], since: '0.0.0'}]`
    if (Array.isArray(originalOption.default)) {
      option.default = originalOption.default.at(-1).value;
    }

    if (Array.isArray(originalOption.choices)) {
      const choices = showDeprecated
        ? [...originalOption.choices]
        : originalOption.choices.filter((choice) => !choice.deprecated);

      if (option.name === "parser") {
        choices.push(
          ...collectParsersFromLanguages(choices, languages, plugins)
        );
      }

      option.choices = choices;
    }

    option.pluginDefaults = Object.fromEntries(
      plugins
        .filter((plugin) => plugin.defaultOptions?.[option.name] !== undefined)
        .map((plugin) => [plugin.name, plugin.defaultOptions[option.name]])
    );

    options.push(option);
  }

  options.sort((a, b) => (a.name === b.name ? 0 : a.name < b.name ? -1 : 1));

  return { languages, options };
}

function* collectParsersFromLanguages(parserChoices, languages, plugins) {
  const existingParsers = new Set(parserChoices.map((choice) => choice.value));

  for (const language of languages) {
    if (language.parsers) {
      for (const value of language.parsers) {
        if (!existingParsers.has(value)) {
          existingParsers.add(value);
          const plugin = plugins.find((plugin) => plugin.parsers?.[value]);
          let description = language.name;
          if (plugin?.name) {
            description += ` (plugin: ${plugin.name})`;
          }
          yield { value, description };
        }
      }
    }
  }
}

export { getSupportInfo };
