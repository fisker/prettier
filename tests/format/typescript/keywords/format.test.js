runFormatTest(import.meta, ["typescript"], {
  errors: {
    "babel-ts": ["keywords.ts", "module.ts"],
    "acorn-ts": ["keywords-2.ts"],
  },
});
