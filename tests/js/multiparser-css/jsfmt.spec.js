run_spec(__dirname, ["babel", "typescript", "flow"], {
  errors: { espree: ["issue-6259.js"] },
});
