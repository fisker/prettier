runFormatTest(import.meta, ["typescript"], {
  errors: { "acorn-ts": ["callWithSpreadES6.ts"] },
});
