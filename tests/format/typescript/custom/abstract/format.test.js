runFormatTest(import.meta, ["typescript"], {
  errors: {
    "babel-ts": ["abstractProperties.ts", "abstractPropertiesWithBreaks.ts"],
    "oxc-ts": ["abstractProperties.ts"],
    "acorn-ts": ["abstractNewlineHandling.ts", "abstractProperties.ts"],
  },
});
