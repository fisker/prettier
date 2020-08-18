const fixtures = {
  dirname: __dirname,
  snippets: [
    "var a = { /* comment */      \nb };", // trailing whitespace after comment
    "var a = { /* comment */\nb };",
  ],
};

const errors = { espree: ["dangling.js", "issues.js", "last-arg.js"] };
run_spec(fixtures, ["babel", "flow", "typescript"], { errors });
run_spec(fixtures, ["babel", "flow", "typescript"], { semi: false, errors });
