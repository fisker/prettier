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

function normalizeCliOptions(options, optionInfos, opts) {
  return prettierNormalizeCliOptions(options, optionInfos, {
    colorsModule: chalk,
    levenshteinDistance: leven,
    descriptor: cliDescriptor,
    ...opts,
  });
}

export default normalizeCliOptions;
