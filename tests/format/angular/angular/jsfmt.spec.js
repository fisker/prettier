const { outdent } = require("outdent");

const fixtures = {
  dirname: __dirname,
  snippets: [
    {
      code: outdent`
        <div
          [target]=" {\u0020
            trailingComma : 'notAllowed'
          }"
          [target]=" [\u0020
            longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong
          ]"
          test='foo
        \u0020\u0020
          {{       invalid
                  invalid       }}
        \u0020\u0020
          bar
        \u0020\u0020
                {{       valid       }}
        \u0020\u0020
          baz'
        ></div>
      `,
      name: "attributes.component.html",
    },
    {
      code: outdent`
        <textarea>
            {{ generatedDiscountCodes }}</textarea>
        <textarea>\u0020\u0020
        {{ generatedDiscountCodes }}</textarea>
        <textarea>\u0020\u0020
            {{ generatedDiscountCodes }}</textarea>
        <textarea>
            {{ generatedDiscountCodes }}123</textarea>
        <textarea>\u0020\u0020
        {{ generatedDiscountCodes }}123</textarea>
        <textarea>\u0020\u0020
            {{ generatedDiscountCodes }}123</textarea>
        <textarea type="text">\u0020\u0020
        {{ generatedDiscountCodes }}</textarea>
        <textarea type="text">\u0020\u0020
            {{ generatedDiscountCodes }}</textarea>
        <textarea type="text">\u0020\u0020
        {{ generatedDiscountCodes }}123</textarea>
        <textarea type="text">\u0020\u0020
            {{ generatedDiscountCodes }}123</textarea>
      `,
      name: "first-lf.component.html",
    },
  ],
};
run_spec(fixtures, ["angular"], { trailingComma: "none" });
run_spec(fixtures, ["angular"]);
run_spec(fixtures, ["angular"], { printWidth: 1 });
run_spec(fixtures, ["angular"], { htmlWhitespaceSensitivity: "ignore" });
run_spec(fixtures, ["angular"], { bracketSpacing: false });
