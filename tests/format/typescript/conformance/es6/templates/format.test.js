runFormatTest(import.meta, ["typescript"], {
  errors: {
    "acorn-ts": ["templateStringWithEmbeddedTypeAssertionOnAdditionES6.ts"],
  },
});
