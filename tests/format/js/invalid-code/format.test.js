runFormatTest(import.meta, ["babel"], {
  errors: { acorn: true, "acorn-ts": true, espree: true },
});
