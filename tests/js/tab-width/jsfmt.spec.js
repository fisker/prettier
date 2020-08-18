const errors = { espree: ["class.js"] };

run_spec(__dirname, ["babel", "flow", "typescript"], { errors });
run_spec(__dirname, ["babel", "flow", "typescript"], { tabWidth: 4, errors });
