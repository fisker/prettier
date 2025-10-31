/**
 * Array of pragma names that indicate formatting should be applied.
 * @type {string[]}
 */
export const FORMAT_PRAGMAS = ["format", "prettier"];

/**
 * Array of pragma names that indicate formatting should be ignored.
 * @type {string[]}
 */
export const FORMAT_IGNORE_PRAGMAS = FORMAT_PRAGMAS.map(
  (pragma) => `no${pragma}`,
);

/**
 * The default pragma name to insert when adding format directives.
 * @type {string}
 */
export const FORMAT_PRAGMA_TO_INSERT = FORMAT_PRAGMAS[0];

// Regular expressions are put in this file so they can be evaluated

/**
 * Regular expression to check if a YAML comment is a format pragma.
 * Matches comments like `@format` or `@prettier`.
 * @type {RegExp}
 */
export const YAML_IS_PRAGMA_REGEXP = new RegExp(
  String.raw`^\s*@(?:${FORMAT_PRAGMAS.join("|")})\s*$`,
  "u",
);

/**
 * Helper function to create a pair of RegExp for format and ignore pragmas.
 * @param {(pragmas: string[]) => RegExp} createRegExp - Function to create a RegExp from pragmas
 * @returns {[RegExp, RegExp]} Tuple of format pragma RegExp and ignore pragma RegExp
 */
function createPragmaRegExps(createRegExp) {
  return /** @type {[RegExp, RegExp]} */ (
    [FORMAT_PRAGMAS, FORMAT_IGNORE_PRAGMAS].map(createRegExp)
  );
}

/**
 * Regular expressions to check for format and ignore pragmas in YAML comments.
 */
export const [YAML_HAS_PRAGMA_REGEXP, YAML_HAS_IGNORE_PRAGMA_REGEXP] =
  createPragmaRegExps(
    (pragmas) =>
      new RegExp(
        String.raw`^\s*#[^\S\n]*@(?:${pragmas.join("|")})\s*?(?:\n|$)`,
        "u",
      ),
  );

/**
 * Regular expressions to check for format and ignore pragmas in GraphQL comments.
 */
export const [GRAPHQL_HAS_PRAGMA_REGEXP, GRAPHQL_HAS_IGNORE_PRAGMA_REGEXP] =
  createPragmaRegExps(
    (pragmas) =>
      new RegExp(
        String.raw`^\s*#[^\S\n]*@(?:${pragmas.join("|")})\s*(?:\n|$)`,
        "u",
      ),
  );

/**
 * Regular expressions to check for format and ignore pragmas in HTML comments.
 */
export const [HTML_HAS_PRAGMA_REGEXP, HTML_HAS_IGNORE_PRAGMA_REGEXP] =
  createPragmaRegExps(
    (pragmas) =>
      new RegExp(String.raw`^\s*<!--\s*@(?:${pragmas.join("|")})\s*-->`, "u"),
  );

/**
 * Regular expressions to check for format and ignore pragmas in Markdown comments.
 * Supports HTML comments, JSX-style comments, and multi-line HTML comments.
 */
export const [MARKDOWN_HAS_PRAGMA_REGEXP, MARKDOWN_HAS_IGNORE_PRAGMA_REGEXP] =
  createPragmaRegExps((pragmas) => {
    const pragma = `@(?:${pragmas.join("|")})`;
    return new RegExp(
      [
        String.raw`<!--\s*${pragma}\s*-->`,
        String.raw`\{\s*\/\*\s*${pragma}\s*\*\/\s*\}`,
        `<!--.*\r?\n[\\s\\S]*(^|\n)[^\\S\n]*${pragma}[^\\S\n]*($|\n)[\\s\\S]*\n.*-->`,
      ].join("|"),
      "mu",
    );
  });
