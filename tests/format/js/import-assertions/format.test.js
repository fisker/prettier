runFormatTest(import.meta, ["oxc", "yuku", "typescript", "hermes"], {
  errors: {
    "babel-ts": [
      "empty.js",
      "multi-types.js",
      "static-import.js",
      "re-export.js",
      "without-from.js",
      "non-type.js",
      "keyword-detect.js",
    ],
    "acorn-ts": ["multi-types.js", "not-import-assertions.js"],
    hermes: [
      "empty.js",
      "multi-types.js",
      "static-import.js",
      "re-export.js",
      "without-from.js",
      "non-type.js",
      "keyword-detect.js",
    ],
  },
});
