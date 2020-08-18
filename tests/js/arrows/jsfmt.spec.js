const errors = {
  espree: ["arrow_function_expression.js", "short_body.js", "type_params.js"],
};

run_spec(__dirname, ["babel", "typescript"], { arrowParens: "always", errors });
run_spec(__dirname, ["babel", "typescript"], { arrowParens: "avoid", errors });
