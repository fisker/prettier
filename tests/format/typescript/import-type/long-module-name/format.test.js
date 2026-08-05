runFormatTest(import.meta, ["typescript"], {
  errors: {
    "acorn-ts": [
      "long-module-name.ts",
      "long-module-name2.ts",
      "long-module-name3.ts",
      "long-module-name4.ts",
      "long-module-name5.ts",
    ],
  },
});
