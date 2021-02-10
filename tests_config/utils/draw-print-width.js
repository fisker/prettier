"use strict";

const { getStringWidth } = require("../../src/common/util");

function drawPrintWidth(text, printWidth) {
  const [eol] = text.match(/\r\n?|\n/) || [];
  const lines = eol ? text.split(eol) : [text];
  if (lines.every((line) => getStringWidth(line) <= printWidth)) {
    return text;
  }

  return lines
    .map((line) => {
      let before = "";
      let beforeWidth = 0;
      for (
        let index = 0;
        beforeWidth < printWidth && index < line.length;
        index++
      ) {
        const char = line.charAt(index);
        const width = getStringWidth(char);
        beforeWidth += width;
        before += char;
      }

      const after = line.slice(before.length);
      if (beforeWidth < printWidth) {
        before += " ".repeat(printWidth - beforeWidth);
      }

      return after ? `${before} | ${after}` : `${before} |`;
    })
    .join(eol);
}

module.exports = drawPrintWidth;
