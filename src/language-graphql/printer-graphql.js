"use strict";

const {
  builders: { join, hardline, line, softline, group, indent, ifBreak },
} = require("../document");
const { isNextLineEmpty, isNonEmptyArray } = require("../common/util");
const { insertPragma } = require("./pragma");
const { locStart, locEnd } = require("./loc");

function genericPrint(node, options, print) {
  if (!node) {
    return "";
  }

  if (typeof node === "string") {
    return node;
  }

  switch (node.kind) {
    case "Document": {
      const parts = [];
      const { definitions } = node;
      for (const [index, definition] of definitions.entries()) {
        parts.push(print(definition));
        if (index !== definitions.length - 1) {
          parts.push(hardline);
          if (isNextLineEmpty(options.originalText, definition, locEnd)) {
            parts.push(hardline);
          }
        }
      }

      return [...parts, hardline];
    }
    case "OperationDefinition": {
      const hasOperation = options.originalText[locStart(node)] !== "{";
      const hasName = Boolean(node.name);
      return [
        hasOperation ? node.operation : "",
        hasOperation && hasName ? [" ", print(node.name)] : "",
        isNonEmptyArray(node.variableDefinitions)
          ? group([
              "(",
              indent([
                softline,
                join(
                  [ifBreak("", ", "), softline],
                  node.variableDefinitions.map((variableDefinition) =>
                    print(node[variableDefinition])
                  )
                ),
              ]),
              softline,
              ")",
            ])
          : "",
        printDirectives(node, print),
        node.selectionSet ? (!hasOperation && !hasName ? "" : " ") : "",
        print(node.selectionSet),
      ];
    }
    case "FragmentDefinition": {
      return [
        "fragment ",
        print(node.name),
        isNonEmptyArray(node.variableDefinitions)
          ? group([
              "(",
              indent([
                softline,
                join(
                  [ifBreak("", ", "), softline],
                  node.variableDefinitions.map((variableDefinition) =>
                    print(node[variableDefinition])
                  )
                ),
              ]),
              softline,
              ")",
            ])
          : "",
        " on ",
        print(node.typeCondition),
        printDirectives(node, print),
        " ",
        print(node.selectionSet),
      ];
    }
    case "SelectionSet": {
      return [
        "{",
        indent([
          hardline,
          join(hardline, printSequence(node.selections, options, print)),
        ]),
        hardline,
        "}",
      ];
    }
    case "Field": {
      return group([
        node.alias ? [print(node.alias), ": "] : "",
        print(node.name),
        node.arguments.length > 0
          ? group([
              "(",
              indent([
                softline,
                join(
                  [ifBreak("", ", "), softline],

                  printSequence(node.arguments, options, print)
                ),
              ]),
              softline,
              ")",
            ])
          : "",
        printDirectives(node, print),
        node.selectionSet ? " " : "",
        print(node.selectionSet),
      ]);
    }
    case "Name": {
      return node.value;
    }
    case "StringValue": {
      if (node.block) {
        return [
          '"""',
          hardline,
          join(hardline, node.value.replace(/"""/g, "\\$&").split("\n")),
          hardline,
          '"""',
        ];
      }
      return [
        '"',
        node.value.replace(/["\\]/g, "\\$&").replace(/\n/g, "\\n"),
        '"',
      ];
    }
    case "IntValue":
    case "FloatValue":
    case "EnumValue": {
      return node.value;
    }
    case "BooleanValue": {
      return node.value ? "true" : "false";
    }
    case "NullValue": {
      return "null";
    }
    case "Variable": {
      return ["$", print(node.name)];
    }
    case "ListValue": {
      return group([
        "[",
        indent([
          softline,
          join(
            [ifBreak("", ", "), softline],
            node.values.map((value) => print(node[value]))
          ),
        ]),
        softline,
        "]",
      ]);
    }
    case "ObjectValue": {
      return group([
        "{",
        options.bracketSpacing && node.fields.length > 0 ? " " : "",
        indent([
          softline,
          join(
            [ifBreak("", ", "), softline],
            node.fields.map((field) => print(node[field]))
          ),
        ]),
        softline,
        ifBreak(
          "",
          options.bracketSpacing && node.fields.length > 0 ? " " : ""
        ),
        "}",
      ]);
    }
    case "ObjectField":
    case "Argument": {
      return [print(node.name), ": ", print(node.value)];
    }

    case "Directive": {
      return [
        "@",
        print(node.name),
        node.arguments.length > 0
          ? group([
              "(",
              indent([
                softline,
                join(
                  [ifBreak("", ", "), softline],
                  printSequence(node.arguments, options, print)
                ),
              ]),
              softline,
              ")",
            ])
          : "",
      ];
    }

    case "NamedType": {
      return print(node.name);
    }

    case "VariableDefinition": {
      return [
        print(node.variable),
        ": ",
        print(node.type),
        node.defaultValue ? [" = ", print(node.defaultValue)] : "",
        printDirectives(node, print),
      ];
    }

    case "ObjectTypeExtension":
    case "ObjectTypeDefinition": {
      return [
        print(node.description),
        node.description ? hardline : "",
        node.kind === "ObjectTypeExtension" ? "extend " : "",
        "type ",
        print(node.name),
        node.interfaces.length > 0
          ? [" implements ", ...printInterfaces(node, options, print)]
          : "",
        printDirectives(node, print),
        node.fields.length > 0
          ? [
              " {",
              indent([
                hardline,
                join(
                  hardline,

                  printSequence(node.fields, options, print)
                ),
              ]),
              hardline,
              "}",
            ]
          : "",
      ];
    }

    case "FieldDefinition": {
      return [
        print(node.description),
        node.description ? hardline : "",
        print(node.name),
        node.arguments.length > 0
          ? group([
              "(",
              indent([
                softline,
                join(
                  [ifBreak("", ", "), softline],

                  printSequence(node.arguments, options, print)
                ),
              ]),
              softline,
              ")",
            ])
          : "",
        ": ",
        print(node.type),
        printDirectives(node, print),
      ];
    }

    case "DirectiveDefinition": {
      return [
        print(node.description),
        node.description ? hardline : "",
        "directive ",
        "@",
        print(node.name),
        node.arguments.length > 0
          ? group([
              "(",
              indent([
                softline,
                join(
                  [ifBreak("", ", "), softline],

                  printSequence(node.arguments, options, print)
                ),
              ]),
              softline,
              ")",
            ])
          : "",
        node.repeatable ? " repeatable" : "",
        " on ",
        join(
          " | ",
          node.locations.map((location) => print(node[location]))
        ),
      ];
    }

    case "EnumTypeExtension":
    case "EnumTypeDefinition": {
      return [
        print(node.description),
        node.description ? hardline : "",
        node.kind === "EnumTypeExtension" ? "extend " : "",
        "enum ",
        print(node.name),
        printDirectives(node, print),

        node.values.length > 0
          ? [
              " {",
              indent([
                hardline,
                join(hardline, printSequence(node.values, options, print)),
              ]),
              hardline,
              "}",
            ]
          : "",
      ];
    }

    case "EnumValueDefinition": {
      return [
        print(node.description),
        node.description ? hardline : "",
        print(node.name),
        printDirectives(node, print),
      ];
    }

    case "InputValueDefinition": {
      return [
        print(node.description),
        node.description ? (node.description.block ? hardline : line) : "",
        print(node.name),
        ": ",
        print(node.type),
        node.defaultValue ? [" = ", print(node.defaultValue)] : "",
        printDirectives(node, print),
      ];
    }

    case "InputObjectTypeExtension":
    case "InputObjectTypeDefinition": {
      return [
        print(node.description),
        node.description ? hardline : "",
        node.kind === "InputObjectTypeExtension" ? "extend " : "",
        "input ",
        print(node.name),
        printDirectives(node, print),
        node.fields.length > 0
          ? [
              " {",
              indent([
                hardline,
                join(
                  hardline,

                  printSequence(node.fields, options, print)
                ),
              ]),
              hardline,
              "}",
            ]
          : "",
      ];
    }

    case "SchemaDefinition": {
      return [
        "schema",
        printDirectives(node, print),
        " {",
        node.operationTypes.length > 0
          ? indent([
              hardline,
              join(
                hardline,

                printSequence(node.operationTypes, options, print)
              ),
            ])
          : "",
        hardline,
        "}",
      ];
    }

    case "OperationTypeDefinition": {
      return [print(node.operation), ": ", print(node.type)];
    }

    case "InterfaceTypeExtension":
    case "InterfaceTypeDefinition": {
      return [
        print(node.description),
        node.description ? hardline : "",
        node.kind === "InterfaceTypeExtension" ? "extend " : "",
        "interface ",
        print(node.name),
        node.interfaces.length > 0
          ? [" implements ", ...printInterfaces(node, options, print)]
          : "",
        printDirectives(node, print),
        node.fields.length > 0
          ? [
              " {",
              indent([
                hardline,
                join(
                  hardline,

                  printSequence(node.fields, options, print)
                ),
              ]),
              hardline,
              "}",
            ]
          : "",
      ];
    }

    case "FragmentSpread": {
      return ["...", print(node.name), printDirectives(node, print)];
    }

    case "InlineFragment": {
      return [
        "...",
        node.typeCondition ? [" on ", print(node.typeCondition)] : "",
        printDirectives(node, print),
        " ",
        print(node.selectionSet),
      ];
    }

    case "UnionTypeExtension":
    case "UnionTypeDefinition": {
      return group([
        print(node.description),
        node.description ? hardline : "",
        group([
          node.kind === "UnionTypeExtension" ? "extend " : "",
          "union ",
          print(node.name),
          printDirectives(node, print),
          node.types.length > 0
            ? [
                " =",
                ifBreak("", " "),
                indent([
                  ifBreak([line, "  "]),
                  join(
                    [line, "| "],
                    node.types.map((type) => print(node[type]))
                  ),
                ]),
              ]
            : "",
        ]),
      ]);
    }

    case "ScalarTypeExtension":
    case "ScalarTypeDefinition": {
      return [
        print(node.description),
        node.description ? hardline : "",
        node.kind === "ScalarTypeExtension" ? "extend " : "",
        "scalar ",
        print(node.name),
        printDirectives(node, print),
      ];
    }

    case "NonNullType": {
      return [print(node.type), "!"];
    }

    case "ListType": {
      return ["[", print(node.type), "]"];
    }

    default:
      /* istanbul ignore next */
      throw new Error("unknown graphql type: " + JSON.stringify(node.kind));
  }
}

function printDirectives(node, print) {
  if (node.directives.length === 0) {
    return "";
  }

  const printed = join(
    line,
    node.directives.map((directive) => print(node[directive]))
  );

  if (
    node.kind === "FragmentDefinition" ||
    node.kind === "OperationDefinition"
  ) {
    return group([line, printed]);
  }

  return [" ", group(indent([softline, printed]))];
}

function printSequence(sequence, options, print) {
  const count = sequence.length;

  return sequence.map((node, i) => {
    const printed = print(node);

    if (isNextLineEmpty(options.originalText, node, locEnd) && i < count - 1) {
      return [printed, hardline];
    }

    return printed;
  });
}

function canAttachComment(node) {
  return node.kind && node.kind !== "Comment";
}

function printComment(comment) {
  if (comment.kind === "Comment") {
    return "#" + comment.value.trimEnd();
  }

  /* istanbul ignore next */
  throw new Error("Not a comment: " + JSON.stringify(comment));
}

function printInterfaces(node, options, print) {
  const parts = [];
  const { interfaces } = node;
  const printed = interfaces.map((node) => print(node[node]));

  for (let index = 0; index < interfaces.length; index++) {
    const interfaceNode = interfaces[index];
    parts.push(printed[index]);
    const nextInterfaceNode = interfaces[index + 1];
    if (nextInterfaceNode) {
      const textBetween = options.originalText.slice(
        interfaceNode.loc.end,
        nextInterfaceNode.loc.start
      );
      const hasComment = textBetween.includes("#");
      const separator = textBetween.replace(/#.*/g, "").trim();

      parts.push(separator === "," ? "," : " &", hasComment ? line : " ");
    }
  }

  return parts;
}

function clean(/*node, newNode , parent*/) {}
clean.ignoredProperties = new Set(["loc", "comments"]);

function hasPrettierIgnore(node) {
  return (
    node &&
    Array.isArray(node.comments) &&
    node.comments.some((comment) => comment.value.trim() === "prettier-ignore")
  );
}

module.exports = {
  print: genericPrint,
  massageAstNode: clean,
  hasPrettierIgnore,
  insertPragma,
  printComment,
  canAttachComment,
};
