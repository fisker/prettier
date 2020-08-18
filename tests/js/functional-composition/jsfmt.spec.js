run_spec(__dirname, ["babel", "flow", "typescript"], {
  errors: {
    espree: ["pipe-function-calls-with-comments.js", "pipe-function-calls.js"],
  },
});
