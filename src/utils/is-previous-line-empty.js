import { skipSpaces } from "./skip.js";
import skipNewline from "./skip-newline.js";

// Note: this function doesn't ignore leading comments unlike isNextLineEmpty
/**
 * @param {string} text
 * @param {number} startIndex
 * @returns {boolean}
 */
function isPreviousLineEmpty(text, startIndex) {
  /** @type {number | false} */
  let index = startIndex - 1;
  index = skipSpaces(text, index, { backwards: true });
  index = skipNewline(text, index, { backwards: true });
  index = skipSpaces(text, index, { backwards: true });
  const indexAfterNewline = skipNewline(text, index, { backwards: true });
  return index !== indexAfterNewline;
}

export default isPreviousLineEmpty;
