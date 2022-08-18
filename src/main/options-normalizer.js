import vnopts from "vnopts";
import getLast from "../utils/get-last.js";

/**
 * @typedef {import("./support").NamedOptionInfo} NamedOptionInfo
 */

let hasDeprecationWarned;

/**
 * @param {*} options
 * @param {*} optionInfos
 * @param {{ logger?: false; isCLI?: boolean; passThrough?: boolean; levenshteinDistance?: any }} param2
 */
function normalizeOptions(
  options,
  optionInfos,
  {
    logger = false,
    isCLI = false,
    passThrough = false,
    levenshteinDistance = null,
    descriptor = vnopts.apiDescriptor,
    FlagSchema
  } = {}
) {
  const unknown = !passThrough
    ? (key, value, options) => {
        // Don't suggest `_` for unknown flags
        const { _, ...schemas } = options.schemas;
        return vnopts.levenUnknownHandler(key, value, {
          ...options,
          schemas,
        });
      }
    : Array.isArray(passThrough)
    ? (key, value) =>
        !passThrough.includes(key) ? undefined : { [key]: value }
    : (key, value) => ({ [key]: value });

  const schemas = optionInfosToSchemas(optionInfos, {
    isCLI,
    levenshteinDistance,
    FlagSchema
  });
  const normalizer = new vnopts.Normalizer(schemas, {
    logger,
    unknown,
    descriptor,
  });

  const shouldSuppressDuplicateDeprecationWarnings = logger !== false;

  if (shouldSuppressDuplicateDeprecationWarnings && hasDeprecationWarned) {
    // @ts-expect-error
    normalizer._hasDeprecationWarned = hasDeprecationWarned;
  }

  const normalized = normalizer.normalize(options);

  if (shouldSuppressDuplicateDeprecationWarnings) {
    // @ts-expect-error
    hasDeprecationWarned = normalizer._hasDeprecationWarned;
  }

  return normalized;
}

function optionInfosToSchemas(
  optionInfos,
  { isCLI, levenshteinDistance, FlagSchema }
) {
  const schemas = [];

  if (isCLI) {
    schemas.push(vnopts.AnySchema.create({ name: "_" }));
  }

  for (const optionInfo of optionInfos) {
    schemas.push(
      optionInfoToSchema(optionInfo, {
        isCLI,
        optionInfos,
        levenshteinDistance,
        FlagSchema,
      })
    );

    if (optionInfo.alias && isCLI) {
      schemas.push(
        vnopts.AliasSchema.create({
          // @ts-expect-error
          name: optionInfo.alias,
          sourceName: optionInfo.name,
        })
      );
    }
  }

  return schemas;
}

/**
 * @param {NamedOptionInfo} optionInfo
 * @param {any} param1
 * @returns
 */
function optionInfoToSchema(
  optionInfo,
  { isCLI, optionInfos, levenshteinDistance, FlagSchema }
) {
  const { name } = optionInfo;

  if (name === "plugin-search-dir" || name === "pluginSearchDirs") {
    return vnopts.AnySchema.create({
      // @ts-expect-error
      name,
      preprocess(value) {
        if (value === false) {
          return value;
        }
        value = Array.isArray(value) ? value : [value];
        return value;
      },
      /**
       * @param {Array<unknown> | false} value
       */
      validate(value) {
        if (value === false) {
          return true;
        }
        return value.every((dir) => typeof dir === "string");
      },
      expected() {
        return "false or paths to plugin search dir";
      },
    });
  }

  const parameters = { name };
  let SchemaConstructor;
  const handlers = {};

  switch (optionInfo.type) {
    case "int":
      SchemaConstructor = vnopts.IntegerSchema;
      if (isCLI) {
        parameters.preprocess = Number;
      }
      break;
    case "string":
      SchemaConstructor = vnopts.StringSchema;
      break;
    case "choice":
      SchemaConstructor = vnopts.ChoiceSchema;
      parameters.choices = optionInfo.choices.map((choiceInfo) =>
        typeof choiceInfo === "object" && choiceInfo.redirect
          ? {
              ...choiceInfo,
              redirect: {
                to: { key: optionInfo.name, value: choiceInfo.redirect },
              },
            }
          : choiceInfo
      );
      break;
    case "boolean":
      SchemaConstructor = vnopts.BooleanSchema;
      break;
    case "flag":
      SchemaConstructor = FlagSchema;
      parameters.flags = optionInfos.flatMap((optionInfo) =>
        [
          optionInfo.alias,
          optionInfo.description && optionInfo.name,
          optionInfo.oppositeDescription && `no-${optionInfo.name}`,
        ].filter(Boolean)
      );
      break;
    case "path":
      SchemaConstructor = vnopts.StringSchema;
      break;
    default:
      /* istanbul ignore next */
      throw new Error(`Unexpected type ${optionInfo.type}`);
  }

  if (optionInfo.exception) {
    parameters.validate = (value, schema, utils) =>
      optionInfo.exception(value) || schema.validate(value, utils);
  } else {
    parameters.validate = (value, schema, utils) =>
      value === undefined || schema.validate(value, utils);
  }

  /* istanbul ignore next */
  if (optionInfo.redirect) {
    handlers.redirect = (value) =>
      !value
        ? undefined
        : {
            to: {
              key: optionInfo.redirect.option,
              value: optionInfo.redirect.value,
            },
          };
  }

  /* istanbul ignore next */
  if (optionInfo.deprecated) {
    handlers.deprecated = true;
  }

  // allow CLI overriding, e.g., prettier package.json --tab-width 1 --tab-width 2
  if (isCLI && !optionInfo.array) {
    const originalPreprocess = parameters.preprocess || ((x) => x);
    parameters.preprocess = (value, schema, utils) =>
      schema.preprocess(
        originalPreprocess(Array.isArray(value) ? getLast(value) : value),
        utils
      );
  }

  return optionInfo.array
    ? vnopts.ArraySchema.create({
        ...(isCLI ? { preprocess: (v) => (Array.isArray(v) ? v : [v]) } : {}),
        ...handlers,
        // @ts-expect-error
        valueSchema: SchemaConstructor.create(parameters),
      })
    : SchemaConstructor.create({ ...parameters, ...handlers });
}

function normalizeApiOptions(options, optionInfos, opts) {
  return normalizeOptions(options, optionInfos, opts);
}

function normalizeCliOptions(options, optionInfos, opts) {
  /* istanbul ignore next */
  if (process.env.NODE_ENV !== "production") {

    if (!opts.levenshteinDistance) {
      throw new Error("'levenshteinDistance' option is required.");
    }

    if (!opts.descriptor) {
      throw new Error("'descriptor' option is required.");
    }

    if (!opts.FlagSchema) {
      throw new Error("'FlagSchema' option is required.");
    }
  }

  return normalizeOptions(options, optionInfos, { isCLI: true, ...opts });
}

export { normalizeApiOptions, normalizeCliOptions };
