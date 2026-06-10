const errors = {
  acorn: ["multi-types.js"],
  "acorn-ts": ["multi-types.js"],
  espree: ["multi-types.js"],
  meriyah: ["multi-types.js"],
};
runFormatTest(import.meta, ["babel", "typescript"], { errors });
