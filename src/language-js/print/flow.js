"use strict";

const assert = require("assert");
const { printString, printNumber } = require("../../common/util");
const { locStart, locEnd } = require("../loc");
const { getParentExportDeclaration } = require("../utils");
const { printClass } = require("./class");
const {
  printOpaqueType,
  printTypeAlias,
  printIntersectionType,
  printUnionType,
  printFunctionType,
  printTupleType,
} = require("./type-annotation");
const { printInterface } = require("./interface");
const { printTypeParameters } = require("./type-parameters");
const {
  printExportDeclaration,
  printExportAllDeclaration,
} = require("./module");
const { printTypeAnnotation } = require("./misc");

function printFlow(path, options, print) {
  const n = path.getValue();
  const semi = options.semi ? ";" : "";
  switch (n.type) {
    case "DeclareClass":
      return printFlowDeclaration(path, printClass(path, options, print));
    case "DeclareFunction":
      return printFlowDeclaration(path, [
        "function ",
        path.call(print, "id"),
        n.predicate ? " " : "",
        path.call(print, "predicate"),
        semi,
      ]);
    case "DeclareModule":
      return printFlowDeclaration(path, [
        "module ",
        path.call(print, "id"),
        " ",
        path.call(print, "body"),
      ]);
    case "DeclareModuleExports":
      return printFlowDeclaration(path, [
        "module.exports",
        ": ",
        path.call(print, "typeAnnotation"),
        semi,
      ]);
    case "DeclareVariable":
      return printFlowDeclaration(path, ["var ", path.call(print, "id"), semi]);
    case "DeclareOpaqueType":
      return printFlowDeclaration(path, printOpaqueType(path, options, print));
    case "DeclareInterface":
      return printFlowDeclaration(path, printInterface(path, options, print));
    case "DeclareTypeAlias":
      return printFlowDeclaration(path, printTypeAlias(path, options, print));
    case "DeclareExportDeclaration":
      return printFlowDeclaration(
        path,
        printExportDeclaration(path, options, print)
      );
    case "DeclareExportAllDeclaration":
      return printFlowDeclaration(
        path,
        printExportAllDeclaration(path, options, print)
      );
    case "OpaqueType":
      return printOpaqueType(path, options, print);
    case "TypeAlias":
      return printTypeAlias(path, options, print);
    case "IntersectionTypeAnnotation":
      return printIntersectionType(path, options, print);
    case "UnionTypeAnnotation":
      return printUnionType(path, options, print);
    case "FunctionTypeAnnotation":
      return printFunctionType(path, options, print);
    case "TupleTypeAnnotation":
      return printTupleType(path, options, print);
    case "GenericTypeAnnotation":
      return [
        path.call(print, "id"),
        printTypeParameters(path, options, print, "typeParameters"),
      ];
    // Type Annotations for Facebook Flow, typically stripped out or
    // transformed away before printing.
    case "TypeAnnotation":
      return path.call(print, "typeAnnotation");
    case "QualifiedTypeIdentifier":
      return [path.call(print, "qualification"), ".", path.call(print, "id")];
    case "StringLiteralTypeAnnotation":
      return printString(rawText(n), options);
    case "NumberLiteralTypeAnnotation":
      assert.strictEqual(typeof n.value, "number");
    // fall through
    case "BigIntLiteralTypeAnnotation":
      if (n.extra) {
        return printNumber(n.extra.raw);
      }
      return printNumber(n.raw);
    case "TypeCastExpression": {
      return [
        "(",
        path.call(print, "expression"),
        printTypeAnnotation(path, options, print),
        ")",
      ];
    }
    case "TypeParameterDeclaration":
    case "TypeParameterInstantiation": {
      const printed = printTypeParameters(path, options, print, "params");

      if (options.parser === "flow") {
        const start = locStart(n);
        const end = locEnd(n);
        const commentStartIndex = options.originalText.lastIndexOf("/*", start);
        const commentEndIndex = options.originalText.indexOf("*/", end);
        if (commentStartIndex !== -1 && commentEndIndex !== -1) {
          const comment = options.originalText
            .slice(commentStartIndex + 2, commentEndIndex)
            .trim();
          if (
            comment.startsWith("::") &&
            !comment.includes("/*") &&
            !comment.includes("*/")
          ) {
            return ["/*:: ", printed, " */"];
          }
        }
      }

      return printed;
    }
    case "InferredPredicate":
      return "%checks";
    case "AnyTypeAnnotation":
      return "any";
    case "BooleanTypeAnnotation":
      return "boolean";
    case "BigIntTypeAnnotation":
      return "bigint";
    case "NullLiteralTypeAnnotation":
      return "null";
    case "NumberTypeAnnotation":
      return "number";
    case "SymbolTypeAnnotation":
      return "symbol";
    case "StringTypeAnnotation":
      return "string";
    case "VoidTypeAnnotation":
      return "void";
    case "ThisTypeAnnotation":
      return "this";
  }
}

function printFlowDeclaration(path, printed) {
  const parentExportDecl = getParentExportDeclaration(path);

  if (parentExportDecl) {
    assert.strictEqual(parentExportDecl.type, "DeclareExportDeclaration");
    return printed;
  }

  // If the parent node has type DeclareExportDeclaration, then it
  // will be responsible for printing the "declare" token. Otherwise
  // it needs to be printed with this non-exported declaration node.
  return ["declare ", printed];
}

module.exports = { printFlow };
