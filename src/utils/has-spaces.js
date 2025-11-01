import { skipSpaces } from "./skip.js";

/** @import {SkipOptions} from "./skip.js" */

// Not using, but it's public utils
/* c8 ignore start */
/**
 * @param {string} text
 * @param {number} startIndex
 * @param {SkipOptions=} options
 * @returns {boolean}
 */
function hasSpaces(text, startIndex, options = {}) {
  const index = skipSpaces(
    text,
    options.backwards ? startIndex - 1 : startIndex,
    options,
  );
  return index !== startIndex;
}
/* c8 ignore stop */

export default hasSpaces;
