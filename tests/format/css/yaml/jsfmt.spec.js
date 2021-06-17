const { outdent } = require("outdent");

run_spec(
  {
    dirname: __dirname,
    snippets: [
      {
        code: outdent`
          ---
          hello:     world
          a:${" ".repeat(7)}
                      - 123
                      - 666
          ---

          .class {



          }
        `,
        name: "dirty.css",
      },
    ],
  },
  ["css"]
);
