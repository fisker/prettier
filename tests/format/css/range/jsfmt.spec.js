run_spec(
  {
    dirname: __dirname,
    snippets: [
      { code: ".x{}<<<PRETTIER_RANGE_END>>> \n", name: "issue2267.css" },
    ],
  },
  ["css"]
);
