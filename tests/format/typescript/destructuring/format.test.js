runFormatTest(import.meta, ["typescript"], {
  errors: {
    "acorn-ts": ["destructuring.ts"],
  },
});
