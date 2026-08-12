runFormatTest(import.meta, ["typescript", "flow"], {
  errors: { "acorn-ts": ["single_expand.ts"] },
});
