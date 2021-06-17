const { outdent } = require("outdent");

run_spec(
  {
    dirname: __dirname,
    snippets: [
      {
        code: outdent`
          query {\u0020
            someField # Trailing comment
          }\n\n\n
        `,
        name: "fields.graphql",
      },
    ],
  },
  ["graphql"]
);
