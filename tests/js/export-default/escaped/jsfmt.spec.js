run_spec(__dirname, ["babel"], {
  errors: { espree: ["default-escaped.js"] },
});
