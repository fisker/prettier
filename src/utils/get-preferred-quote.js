import countCharacters from "./count-characters.js";

/**
 * @typedef {'"' | "'"} Quote
 */

/** @type {{ quote: '"', regex: RegExp, escaped: "&quot;" }} */
const DOUBLE_QUOTE = { quote: '"', regex: /"/g, escaped: "&quot;" };
/** @type {{ quote: "'", regex: RegExp, escaped: "&apos;" }} */
const SINGLE_QUOTE = { quote: "'", regex: /'/g, escaped: "&apos;" };

const QUOTES = {
  '"': [DOUBLE_QUOTE, SINGLE_QUOTE],
  "'": [SINGLE_QUOTE, DOUBLE_QUOTE],
};

/**
 *
 * @param {string} rawContent
 * @param {Quote} preferredQuote
 * @returns {DOUBLE_QUOTE | SINGLE_QUOTE}
 */
function getPreferredQuote(rawContent, preferredQuote) {
  const [preferred, alternate] = QUOTES[preferredQuote];

  // If `rawContent` contains at least one of the quote preferred for enclosing
  // the string, we might want to enclose with the alternate quote instead, to
  // minimize the number of escaped quotes.
  const {
    [preferred.quote]: preferredQuotCount,
    [alternate.quote]: alternateQuoteCount,
  } = countCharacters(rawContent, [preferred.quote, alternate.quote]);

  return preferredQuotCount > alternateQuoteCount ? alternate : preferred;
}

export default getPreferredQuote;
