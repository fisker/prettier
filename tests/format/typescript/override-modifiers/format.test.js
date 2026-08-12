runFormatTest(import.meta, ["typescript"], {
  errors: { "acorn-ts": ["override-modifier.ts"] },
});
