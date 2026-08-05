import { tsPlugin as acornTsPlugin } from "@sveltejs/acorn-typescript";
import { Parser as AcornParser } from "acorn";
import acornJsxPlugin from "acorn-jsx";
import createError from "../../common/parser-create-error.js";
import { getOrInsertComputed } from "../../utilities/get-or-insert.js";
import { tryCombinationsSync } from "../../utilities/try-combinations.js";
import postprocess from "./postprocess/index.js";
import createParser from "./utilities/create-parser.js";
import replaceHashbang from "./utilities/replace-hashbang.js";
import {
  getSourceType,
  SOURCE_TYPE_COMBINATIONS,
  SOURCE_TYPE_MODULE,
} from "./utilities/source-types.js";

/**
@import {Options} from "acorn"
@import {SOURCE_TYPE_COMMONJS} from "./utilities/source-types.js"
*/

/** @type {Options} */
const parseOptions = {
  ecmaVersion: "latest",
  // sourceType: "module",
  // onInsertedSemicolon: null,
  // onTrailingComma: null,
  allowReserved: true,
  allowReturnOutsideFunction: true,
  // allowImportExportEverywhere: true,
  // allowAwaitOutsideFunction: null,
  allowSuperOutsideMethod: true,
  // allowHashBang: true,
  checkPrivateFields: false,
  // Required by `@sveltejs/acorn-typescript`
  locations: true,
  ranges: true,
  preserveParens: true,
};

function createParseError(error) {
  const { message, loc } = error;

  /* c8 ignore next 3 */
  if (!loc) {
    return error;
  }

  const { line, column } = loc;

  return createError(message.replace(/ \(\d+:\d+\)$/, ""), {
    loc: {
      start: { line, column: column + 1 },
    },
    cause: error,
  });
}

const parsers = new Map();

/**
@param {string} text
@param {{
  lang: "js" | "ts",
  sourceType: SOURCE_TYPE_MODULE | SOURCE_TYPE_COMMONJS,
  dts?: boolean,
}} options
*/
function parseWithOptions(text, { lang, dts, sourceType }) {
  /** @type {ReturnType<AcornParser.extend>} */
  const Parser = getOrInsertComputed(parsers, `${lang}-${dts}`, () => {
    let Parser = AcornParser;

    if (lang === "ts") {
      Parser = Parser.extend(acornTsPlugin({ dts }));
    }

    if (lang === "js" || !dts) {
      Parser = Parser.extend(acornJsxPlugin());
    }

    return Parser;
  });

  const comments = [];

  const ast = Parser.parse(text, {
    ...parseOptions,
    sourceType,
    allowImportExportEverywhere: sourceType === SOURCE_TYPE_MODULE,
    onComment: comments,
  });

  // @ts-expect-error -- expected
  ast.comments = comments;

  return ast;
}

function parseJs(text, options) {
  const sourceType = getSourceType(options?.filepath);
  const combinations = (
    sourceType ? [sourceType] : SOURCE_TYPE_COMBINATIONS
  ).map(
    (sourceType) => () => parseWithOptions(text, { lang: "js", sourceType }),
  );

  let ast;
  try {
    ast = tryCombinationsSync(combinations);
  } catch (/** @type {any} */ { errors: [error] }) {
    throw createParseError(error);
  }

  return postprocess(ast, { text, astType: "acorn-js" });
}

function parseTs(text, options) {
  const filepath = options?.filepath;

  const typescriptPluginOptionCombinations =
    typeof filepath === "string" && /\.(?:jsx|tsx)$/i.test(filepath)
      ? [{ dts: true }]
      : [{ dts: false }, { dts: true }];

  const textToParse = replaceHashbang(text);
  const sourceType = getSourceType(filepath);
  const combinations = (
    sourceType ? [sourceType] : SOURCE_TYPE_COMBINATIONS
  ).flatMap((sourceType) =>
    typescriptPluginOptionCombinations.map(
      (options) => () =>
        parseWithOptions(textToParse, { lang: "ts", ...options, sourceType }),
    ),
  );

  let ast;
  try {
    ast = tryCombinationsSync(combinations);
  } catch (/** @type {any} */ { errors: [error] }) {
    throw createParseError(error);
  }

  return postprocess(ast, { text, astType: "acorn-ts" });
}

const acorn = /* @__PURE__ */ createParser(parseJs);
const acornTs = /* @__PURE__ */ createParser(parseTs);

export { acorn, acornTs as "acorn-ts" };
