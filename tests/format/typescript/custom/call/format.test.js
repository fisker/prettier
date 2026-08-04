runFormatTest(import.meta, ["typescript"], {
  errors: {
    "acorn-ts": ["callSignature.ts"],
  },
});
