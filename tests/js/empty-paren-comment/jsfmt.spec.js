run_spec(__dirname, ["babel", "flow", "typescript"], {
  errors: { espree: ["empty_paren_comment.js"] },
});
