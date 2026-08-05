runFormatTest(import.meta, ["typescript"], {
  errors: {
    "acorn-ts": ["mixinClassesAnnotated.ts", "mixinClassesAnonymous.ts"],
  },
});
