runFormatTest(import.meta, ["typescript"], {
  errors: { "acorn-ts": ["import-type-attributes.ts"] },
});
