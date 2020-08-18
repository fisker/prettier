run_spec(__dirname, ["babel", "flow"], {
  errors: { espree: ["break.js", "edge_case.js"] },
});
