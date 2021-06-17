const { outdent } = require("outdent");

run_spec(
  {
    dirname: __dirname,
    snippets: [
      {
        code: outdent`
          type Type1 implements A, B, C, D
          # {&&&&&&&&
          # Should separate by ',' not '&'
          {a: a}

          type Type2 implements A, B, C, D
          # &&&&{}&&&&
          # Should separate by ',' not '&'
          {a: a}

          type Type3 implements A,\u0020
          # &&&&&&&& comment line 1
            \u0020# &&&&&&&& comment line 2
          B& C, D
          {a: a}

          type Type4 implements A
          # &&&&&&&& comment line 1
          ,\u0020
            \u0020# &&&&&&&& comment line 2
          B& C, D
          {a: a}

          type Type5 implements A\u0020
          # &&&&&&&& comment line 1
            \u0020# &&&&&&&& comment line 2
          ,B& C, D
          {a: a}\n
        `,
        name: "separator-detection.graphql",
      },
    ],
  },
  ["graphql"]
);
