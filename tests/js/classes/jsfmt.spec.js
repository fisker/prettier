run_spec(__dirname, ["babel", "flow", "typescript"], {
  errors: { espree: ["break.js", "property.js"] },
});
