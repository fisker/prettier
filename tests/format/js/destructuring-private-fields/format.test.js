runFormatTest(import.meta, ["babel", "babel-flow", "babel-ts"], {
  errors: {
    acorn: true,
    "acorn-ts": true,
    espree: true,
    meriyah: true,
    oxc: true,
    "oxc-ts": true,
    yuku: true,
    "yuku-ts": true,
  },
});
