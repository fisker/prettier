"use strict";
const path = require("path");

const selector = [
  ":matches(ImportDeclaration, ExportNamedDeclaration, ImportExpression)",
  " > ",
  "Literal.source",
].join("");

const messageId = "no-doc-index-import";
const docIndexFile = path.join(__dirname, "../../../src/document/index.js");
const ignored = new Set([
  path.join(__dirname, "../../../src/index.js"),
  path.join(__dirname, "../../../src/standalone.js"),
]);

const docProperties = new Set(["builders", "debug", "printer", "utils"]);

function fix(source, context) {
  // only fix `import doc from './document/index.js'`
  if (
    !(
      source.parent.type === "ImportDeclaration" &&
      source.parent.specifiers.length === 1 &&
      source.parent.specifiers[0].type === "ImportDefaultSpecifier" &&
      source.parent.specifiers[0].local.type === "Identifier" &&
      source.parent.specifiers[0].local.name === "doc"
    )
  ) {
    return;
  }

  const variables = context.getDeclaredVariables(source.parent);
  if (variables.length !== 1 || variables[0].name !== "doc") {
    return;
  }

  const [{ references }] = variables;
  if (references.length !== 1) {
    return;
  }

  // Only fix `const {builders: {}} = doc`
  const [{ identifier }] = references;

  if (
    !(
      identifier.parent.type === "VariableDeclarator" &&
      identifier.parent.init === identifier &&
      identifier.parent.id.type === "ObjectPattern" &&
      identifier.parent.id.properties.every(
        (property) =>
          property.type === "Property" &&
          !property.computed &&
          property.key.type === "Identifier" &&
          docProperties.has(property.key.name)
      ) &&
      identifier.parent.parent.type === "VariableDeclaration" &&
      identifier.parent.parent.kind === "const" &&
      identifier.parent.parent.declarations.length === 1 &&
      identifier.parent.parent.declarations[0] === identifier.parent
    )
  ) {
    return;
  }

  return function* (fixer) {
    const sourceCode = context.getSourceCode();
    const text = identifier.parent.id.properties
      .map((property) => {
        const propertyName = property.key.name;

        return `import ${sourceCode.getText(
          property.value
        )} from "${source.value.replace(
          "/document/index.js",
          `/document/${propertyName}.js`
        )}";`;
      })
      .join("\n");

    yield fixer.replaceText(source.parent, text);
    yield fixer.remove(identifier.parent.parent);
  };
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      url: "https://github.com/prettier/prettier/blob/main/scripts/tools/eslint-plugin-prettier-internal-rules/no-doc-index-import.js",
    },
    messages: {
      [messageId]: "Do not {{type}} document/index.js file",
    },
    fixable: "code",
  },
  create(context) {
    const file = context.getPhysicalFilename();
    if (ignored.has(file)) {
      return {};
    }

    const dir = path.dirname(file);

    return {
      [selector](node) {
        const { value } = node;

        if (
          !value.startsWith(".") ||
          !value.endsWith("/document/index.js") ||
          path.join(dir, value) !== docIndexFile
        ) {
          return;
        }

        context.report({
          node,
          messageId,
          data: {
            type: node.parent.type.slice(0, 6).toLowerCase(),
          },
          fix: fix(node, context),
        });
      },
    };
  },
};
