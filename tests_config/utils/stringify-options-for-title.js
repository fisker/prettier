"use strict";

function stringifyOptions(options) {
  const string = JSON.stringify(
    options || {},
    (key, value) =>
      key === "disableBabelTS"
        ? undefined
        : value === Infinity
        ? "Infinity"
        : value
  );

  return string === "{}" ? "" : string;
}

module.exports = stringifyOptions;
