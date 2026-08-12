const errors = { "acorn-ts": ["expression-statement.ts"] };

runFormatTest(import.meta, ["typescript"], { errors });
runFormatTest(import.meta, ["typescript"], { semi: false, errors });
