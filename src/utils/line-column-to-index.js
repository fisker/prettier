/**
 * Converts a line and column position to an absolute character index in the text.
 * Super inefficient, needs to be cached.
 * @param {{ line: number, column: number }} lineColumn - The line and column position
 * @param {string} text - The text to search in
 * @returns {number} The absolute character index
 */
function lineColumnToIndex(lineColumn, text) {
  let index = 0;
  for (let i = 0; i < lineColumn.line - 1; ++i) {
    index = text.indexOf("\n", index) + 1;
  }
  return index + lineColumn.column;
}

export default lineColumnToIndex;
