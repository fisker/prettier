runFormatTest(import.meta, ["babel", "flow", "typescript"], {
  errors: {
    flow: ["template-literal.js", "import-phase.js"],
    hermes: ["template-literal.js", "import-phase.js"],
    acorn: ["import-phase.js"],
    "acorn-ts": ["import-phase.js"],
    espree: ["import-phase.js"],
    typescript: ["import-phase.js"],
  },
});
