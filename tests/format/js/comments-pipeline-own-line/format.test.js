runFormatTest(import.meta, ["babel"], {
  errors: {
    acorn: true,
    "acorn-ts": true,
    espree: true,
    meriyah: true,
    oxc: true,
    "oxc-ts": true,
    yuku: true,
  },
});
