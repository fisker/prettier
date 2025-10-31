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
 * Regular expression to check for format pragma in YAML comments.
 * @type {RegExp}
 */
export const YAML_HAS_PRAGMA_REGEXP = /** @type {RegExp} */ (
  [FORMAT_PRAGMAS, FORMAT_IGNORE_PRAGMAS].map(
    (pragmas) =>
      new RegExp(
        String.raw`^\s*#[^\S\n]*@(?:${pragmas.join("|")})\s*?(?:\n|$)`,
        "u",
      ),
  )[0]
);

/**
 * Regular expression to check for ignore pragma in YAML comments.
 * @type {RegExp}
 */
export const YAML_HAS_IGNORE_PRAGMA_REGEXP = /** @type {RegExp} */ (
  [FORMAT_PRAGMAS, FORMAT_IGNORE_PRAGMAS].map(
    (pragmas) =>
      new RegExp(
        String.raw`^\s*#[^\S\n]*@(?:${pragmas.join("|")})\s*?(?:\n|$)`,
        "u",
      ),
  )[1]
);

/**
 * Regular expression to check for format pragma in GraphQL comments.
 * @type {RegExp}
 */
export const GRAPHQL_HAS_PRAGMA_REGEXP = /** @type {RegExp} */ (
  [FORMAT_PRAGMAS, FORMAT_IGNORE_PRAGMAS].map(
    (pragmas) =>
      new RegExp(
        String.raw`^\s*#[^\S\n]*@(?:${pragmas.join("|")})\s*(?:\n|$)`,
        "u",
      ),
  )[0]
);

/**
 * Regular expression to check for ignore pragma in GraphQL comments.
 * @type {RegExp}
 */
export const GRAPHQL_HAS_IGNORE_PRAGMA_REGEXP = /** @type {RegExp} */ (
  [FORMAT_PRAGMAS, FORMAT_IGNORE_PRAGMAS].map(
    (pragmas) =>
      new RegExp(
        String.raw`^\s*#[^\S\n]*@(?:${pragmas.join("|")})\s*(?:\n|$)`,
        "u",
      ),
  )[1]
);

/**
 * Regular expression to check for format pragma in HTML comments.
 * @type {RegExp}
 */
export const HTML_HAS_PRAGMA_REGEXP = /** @type {RegExp} */ (
  [FORMAT_PRAGMAS, FORMAT_IGNORE_PRAGMAS].map(
    (pragmas) =>
      new RegExp(String.raw`^\s*<!--\s*@(?:${pragmas.join("|")})\s*-->`, "u"),
  )[0]
);

/**
 * Regular expression to check for ignore pragma in HTML comments.
 * @type {RegExp}
 */
export const HTML_HAS_IGNORE_PRAGMA_REGEXP = /** @type {RegExp} */ (
  [FORMAT_PRAGMAS, FORMAT_IGNORE_PRAGMAS].map(
    (pragmas) =>
      new RegExp(String.raw`^\s*<!--\s*@(?:${pragmas.join("|")})\s*-->`, "u"),
  )[1]
);

/**
 * Regular expression to check for format pragma in Markdown comments.
 * Supports HTML comments, JSX-style comments, and multi-line HTML comments.
 * @type {RegExp}
 */
export const MARKDOWN_HAS_PRAGMA_REGEXP = /** @type {RegExp} */ (
  [FORMAT_PRAGMAS, FORMAT_IGNORE_PRAGMAS].map((pragmas) => {
    const pragma = `@(?:${pragmas.join("|")})`;
    return new RegExp(
      [
        String.raw`<!--\s*${pragma}\s*-->`,
        String.raw`\{\s*\/\*\s*${pragma}\s*\*\/\s*\}`,
        `<!--.*\r?\n[\\s\\S]*(^|\n)[^\\S\n]*${pragma}[^\\S\n]*($|\n)[\\s\\S]*\n.*-->`,
      ].join("|"),
      "mu",
    );
  })[0]
);

/**
 * Regular expression to check for ignore pragma in Markdown comments.
 * Supports HTML comments, JSX-style comments, and multi-line HTML comments.
 * @type {RegExp}
 */
export const MARKDOWN_HAS_IGNORE_PRAGMA_REGEXP = /** @type {RegExp} */ (
  [FORMAT_PRAGMAS, FORMAT_IGNORE_PRAGMAS].map((pragmas) => {
    const pragma = `@(?:${pragmas.join("|")})`;
    return new RegExp(
      [
        String.raw`<!--\s*${pragma}\s*-->`,
        String.raw`\{\s*\/\*\s*${pragma}\s*\*\/\s*\}`,
        `<!--.*\r?\n[\\s\\S]*(^|\n)[^\\S\n]*${pragma}[^\\S\n]*($|\n)[\\s\\S]*\n.*-->`,
      ].join("|"),
      "mu",
    );
  })[1]
);
