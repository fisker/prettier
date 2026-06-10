runFormatTest(import.meta, ["babel", "typescript"], {
  errors: { acorn: true, "acorn-ts": true, espree: true, meriyah: true },
});
