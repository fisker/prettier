const errors = { espree: ["comments.js", "flow-interfaces.js", "no-semi.js"] };

run_spec(__dirname, ["babel", "flow"], { errors });
run_spec(__dirname, ["babel", "flow"], { semi: false, errors });
