import chalk from "chalk";
import leven from "leven";
import vnopts from "vnopts";
import { normalizeCliOptions as prettierNormalizeCliOptions } from "../prettier-internal.js";

const cliDescriptor = {
  key: (key) => (key.length === 1 ? `-${key}` : `--${key}`),
  value: (value) => vnopts.apiDescriptor.value(value),
  pair: ({ key, value }) =>
    value === false
      ? `--no-${key}`
      : value === true
      ? cliDescriptor.key(key)
      : value === ""
      ? `${cliDescriptor.key(key)} without an argument`
      : `${cliDescriptor.key(key)}=${value}`,
};

// To prevent `chalk` and `leven` module from being included in the `standalone.js` bundle, it will take that as an argument if needed.
class FlagSchema extends vnopts.ChoiceSchema {
  #flags = [];

  constructor({ name, flags }) {
    super({ name, choices: flags });
    this.#flags = [...flags].sort();
  }
  preprocess(value, utils) {
    if (
      typeof value === "string" &&
      value.length > 0 &&
      !this.#flags.includes(value)
    ) {
      const suggestion = this.#flags.find(
        (flag) => leven(flag, value) < 3
      );
      if (suggestion) {
        utils.logger.warn(
          [
            `Unknown flag ${chalk.yellow(
              utils.descriptor.value(value)
            )},`,
            `did you mean ${chalk.blue(
              utils.descriptor.value(suggestion)
            )}?`,
          ].join(" ")
        );
        return suggestion;
      }
    }
    return value;
  }
  expected() {
    return "a flag";
  }
};

function normalizeCliOptions(options, optionInfos, opts) {
  const normalized = prettierNormalizeCliOptions(options, optionInfos, {
    levenshteinDistance: leven,
    descriptor: cliDescriptor,
    FlagSchema,
    ...opts,
  });

  if (normalized["plugin-search"] === false) {
    normalized["plugin-search-dir"] = false;
  }

  return normalized
}

export default normalizeCliOptions;
