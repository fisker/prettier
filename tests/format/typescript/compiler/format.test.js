runFormatTest(import.meta, ["typescript"], {
  errors: {
    "babel-ts": ["declareDottedModuleName.ts", "privacyGloImport.ts"],
    "acorn-ts": [
      "castOfAwait.ts",
      "castParentheses.ts",
      "castTest.ts",
      "contextualSignatureInstantiation2.ts",
      "globalIsContextualKeyword.ts",
    ],
  },
});
