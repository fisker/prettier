// TODO: `espree` should work on `jsx.js`
// https://github.com/prettier/prettier/issues/8999

run_spec(__dirname, ["babel", "typescript"], {
  errors: { espree: ["jsx.js"] },
});
