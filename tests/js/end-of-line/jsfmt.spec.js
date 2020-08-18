const errors = { espree: ["multiline.js"] };

run_spec(__dirname, ["babel"], { endOfLine: "lf", errors });
run_spec(__dirname, ["babel"], { endOfLine: "cr", errors });
run_spec(__dirname, ["babel"], { endOfLine: "crlf", errors });
