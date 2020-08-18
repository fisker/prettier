run_spec(__dirname, ["babel", "flow", "typescript"], {
  errors: {
    espree: ["class-implements.js", "declare.js", "generic.js", "misc.js"],
  },
});
