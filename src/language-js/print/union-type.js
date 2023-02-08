import { printComments } from "../../main/comments.js";
import {
  group,
  join,
  line,
  softline,
  indent,
  align,
  ifBreak,
} from "../../document/builders.js";
import pathNeedsParens from "../needs-parens.js";
import { hasLeadingOwnLineComment } from "../utils/index.js";
import { shouldHugType } from "./type-annotation.js";

// `TSUnionType` and `UnionTypeAnnotation`
function printUnionType(path, options, print) {
  const { node } = path;
  // single-line variation
  // A | B | C

  // multi-line variation
  // | A
  // | B
  // | C

  const { parent } = path;

  // If there's a leading comment, the parent is doing the indentation
  const shouldIndent =
    parent.type !== "TypeParameterInstantiation" &&
    parent.type !== "TSTypeParameterInstantiation" &&
    parent.type !== "GenericTypeAnnotation" &&
    parent.type !== "TSTypeReference" &&
    parent.type !== "TSTypeAssertion" &&
    parent.type !== "TupleTypeAnnotation" &&
    parent.type !== "TSTupleType" &&
    !(
      parent.type === "FunctionTypeParam" &&
      !parent.name &&
      path.grandparent.this !== parent
    ) &&
    !(
      (parent.type === "TypeAlias" ||
        parent.type === "VariableDeclarator" ||
        parent.type === "TSTypeAliasDeclaration") &&
      hasLeadingOwnLineComment(options.originalText, node)
    );

  // {
  //   a: string
  // } | null | void
  // should be inlined and not be printed in the multi-line variant
  const shouldHug = shouldHugType(node);

  // We want to align the children but without its comment, so it looks like
  // | child1
  // // comment
  // | child2
  const printed = path.map((typePath) => {
    let printedType = print();
    if (!shouldHug) {
      printedType = align(2, printedType);
    }
    return printComments(typePath, printedType, options);
  }, "types");

  if (shouldHug) {
    return join(" | ", printed);
  }

  const shouldAddStartLine =
    shouldIndent && !hasLeadingOwnLineComment(options.originalText, node);

  const code = [
    ifBreak([shouldAddStartLine ? line : "", "| "]),
    join([line, "| "], printed),
  ];

  if (pathNeedsParens(path, options)) {
    return group([indent(code), softline]);
  }

  if (parent.type === "TupleTypeAnnotation" || parent.type === "TSTupleType") {
    const elementTypes =
      parent[
        // TODO: Remove `types` when babel changes AST of `TupleTypeAnnotation`
        parent.type === "TupleTypeAnnotation" && parent.types
          ? "types"
          : "elementTypes"
      ];

    if (elementTypes.length > 1) {
      return group([
        indent([ifBreak(["(", softline]), code]),
        softline,
        ifBreak(")"),
      ]);
    }
  }

  return group(shouldIndent ? indent(code) : code);
}

export { printUnionType };
