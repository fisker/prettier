import { skipSpaces } from "./skip.js";
import skipNewline from "./skip-newline.js";

/** @import {SkipOptions} from "./skip.js" */

/**
 * @param {string} text
 * @param {number} startIndex
 * @param {SkipOptions=} options
 * @returns {boolean}
 */
function hasNewline(text, startIndex, options = {}) {
  const index = skipSpaces(
    text,
    options.backwards ? startIndex - 1 : startIndex,
    options,
  );
  const indexAfterNewline = skipNewline(text, index, options);
  return index !== indexAfterNewline;
}

export default hasNewline;
