const errors = { espree: ["test_declarations.js"] };

run_spec(__dirname, ["babel", "flow", "typescript"], { errors });
run_spec(__dirname, ["babel", "flow", "typescript"], {
  arrowParens: "avoid",
  errors,
});
