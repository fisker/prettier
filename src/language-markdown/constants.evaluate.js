import { Charset } from "regexp-util";

function toUnicodeRegexp(...categories) {
  const scripts = new Set();
  for (const category of categories) {
    for (const [key, properties] of Object.entries(category)) {
      for (const property of properties) {
        const script =
          key === "Script" ? `\\p{${property}}` : `\\p{${key}=${property}}`;

        try {
          new RegExp(script, "u");
        } catch (error) {
          console.log(error, script);
        }
        scripts.add(script);
      }
    }
  }

  return [...scripts].join("|");
}

// https://github.com/ikatyang/cjk-regex/blob/223f487735ba0ec5c3cfe0e995b75b09dfb6ad6d/src/index.ts#L4C20-L4C27
const cjkLetters = {
  Script: ["Han", "Katakana", "Hiragana", "Hangul", "Bopomofo"],
  General_Category: [
    "Other_Letter",
    "Letter_Number",
    "Other_Symbol",
    "Modifier_Letter",
  ],
};

// https://github.com/ikatyang/cjk-regex/blob/223f487735ba0ec5c3cfe0e995b75b09dfb6ad6d/src/index.ts#L14C7-L14C22
const cjkPunctuations = {
  Block: [
    "CJK_Compatibility",
    "CJK_Symbols_And_Punctuation",
    "Vertical_Forms",
    "CJK_Compatibility_Forms",
    "Small_Form_Variants",
    "Halfwidth_And_Fullwidth_Forms",
    "Ideographic_Description_Characters",
    "Kanbun",
    "CJK_Strokes",
    "Enclosed_CJK_Letters_And_Months",
  ],
};

// https://github.com/prettier/prettier/pull/5402
// https://github.com/prettier/prettier/pull/5480
const additionCjkCharacters = {
  Script_Extensions: ["Han", "Katakana", "Hiragana", "Hangul", "Bopomofo"],
  General_Category: [
    "Other_Letter",
    "Letter_Number",
    "Other_Symbol",
    "Modifier_Letter",
    "Modifier_Symbol",
    "Nonspacing_Mark",
  ],
};

const variationSelectors = {
  Block: ["Variation_Selectors", "Variation_Selectors_Supplement"],
};

const CJK_REGEXP = new RegExp(
  `(?:${toUnicodeRegexp(cjkLetters, cjkPunctuations, additionCjkCharacters)})(?:${toUnicodeRegexp(variationSelectors)})?`,
  "u",
);

const asciiPunctuationCharacters = [
  "!",
  '"',
  "#",
  "$",
  "%",
  "&",
  "'",
  "(",
  ")",
  "*",
  "+",
  ",",
  "-",
  ".",
  "/",
  ":",
  ";",
  "<",
  "=",
  ">",
  "?",
  "@",
  "[",
  "\\",
  "]",
  "^",
  "_",
  "`",
  "{",
  "|",
  "}",
  "~",
];

// https://spec.commonmark.org/0.25/#punctuation-character
// https://unicode.org/Public/5.1.0/ucd/UCD.html#General_Category_Values
const unicodePunctuations = {
  General_Category: [
    /* Pc */ "Connector_Punctuation",
    /* Pd */ "Dash_Punctuation",
    /* Pe */ "Close_Punctuation",
    /* Pf */ "Final_Punctuation",
    /* Pi */ "Initial_Punctuation",
    /* Po */ "Other_Punctuation",
    /* Ps */ "Open_Punctuation",
  ],
};

const PUNCTUATION_REGEXP = new RegExp(
  `(?:${[
    new Charset(...asciiPunctuationCharacters).toRegExp().source,
    toUnicodeRegexp(unicodePunctuations),
  ].join("|")})`,
  "u",
);

export { CJK_REGEXP, PUNCTUATION_REGEXP };
