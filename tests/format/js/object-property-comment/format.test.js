runFormatTest(import.meta, ["babel", "flow"], {
  errors: {
    acorn: ["comment.js"],
    "acorn-ts": ["comment.js"],
    espree: ["comment.js"],
  },
});
