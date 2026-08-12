runFormatTest(import.meta, ["typescript", "flow"], {
  errors: { "acorn-ts": ["issue-18136-2.ts"] },
});
