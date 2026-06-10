const errors = {
  acorn: ["non-octal-eight-and-nine.js"],
  "acorn-ts": ["non-octal-eight-and-nine.js"],
  espree: ["non-octal-eight-and-nine.js"],
  meriyah: ["non-octal-eight-and-nine.js"],
};

runFormatTest(import.meta, ["babel", "flow"], {
  trailingComma: "es5",
  errors,
});
runFormatTest(import.meta, ["babel", "flow"], {
  trailingComma: "all",
  errors,
});
