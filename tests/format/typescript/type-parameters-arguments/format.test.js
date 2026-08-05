runFormatTest(import.meta, ["typescript"], {
  errors: {
    "oxc-ts": ["const.ts"],
    "yuku-ts": ["const.ts"],
    "acorn-ts": [
      "10732.ts",
      "class-method.ts",
      "const.ts",
      "long-function-arg.ts",
    ],
  },
});
