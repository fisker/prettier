const { outdent } = require("outdent");

const fixtures = {
  dirname: __dirname,
  snippets: [
    {
      code: outdent`
        var X = {
          perform: function<${" ".repeat(4)}
            A, B, C, D, E, F, G,${" ".repeat(5)}
            T: (a: A, b: B, c: C, d: D, e: E, f: F) => G // eslint-disable-line space-before-function-paren
          >(${" ".repeat(5)}
            method: T, scope: any,${" ".repeat(5)}
            a: A, b: B, c: C, d: D, e: E, f: F,${" ".repeat(4)}
          ): G {
          }
        }\n
      `,
      name: "break.js",
    },
  ],
};

run_spec(fixtures, ["flow", "babel"]);
run_spec(fixtures, ["flow", "babel"], { trailingComma: "all" });
