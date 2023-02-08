import {
  isSimpleType,
  isObjectType,
  hasComment,
  CommentCheckFlags,
} from "../utils/index.js";
import { printAssignment } from "./assignment.js";
import { printOptionalToken, printDeclareToken } from "./misc.js";

function shouldHugType(node) {
  if (isSimpleType(node) || isObjectType(node)) {
    return true;
  }

  if (node.type === "UnionTypeAnnotation" || node.type === "TSUnionType") {
    const voidCount = node.types.filter(
      (node) =>
        node.type === "VoidTypeAnnotation" ||
        node.type === "TSVoidKeyword" ||
        node.type === "NullLiteralTypeAnnotation" ||
        node.type === "TSNullKeyword"
    ).length;

    const hasObject = node.types.some(
      (node) =>
        node.type === "ObjectTypeAnnotation" ||
        node.type === "TSTypeLiteral" ||
        // This is a bit aggressive but captures Array<{x}>
        node.type === "GenericTypeAnnotation" ||
        node.type === "TSTypeReference"
    );

    const hasComments = node.types.some((node) => hasComment(node));

    if (node.types.length - 1 === voidCount && hasObject && !hasComments) {
      return true;
    }
  }

  return false;
}

/*
- `DeclareTypeAlias`(flow)
- `TypeAlias`(flow)
- `TSTypeAliasDeclaration`(TypeScript)
*/
function printTypeAlias(path, options, print) {
  const semi = options.semi ? ";" : "";
  const { node } = path;
  const parts = [printDeclareToken(path)];

  parts.push("type ", print("id"), print("typeParameters"));
  const rightPropertyName =
    node.type === "TSTypeAliasDeclaration" ? "typeAnnotation" : "right";
  return [
    printAssignment(path, options, print, parts, " =", rightPropertyName),
    semi,
  ];
}

/*
- `TSIndexedAccessType`(TypeScript)
- `IndexedAccessType`(flow)
- `OptionalIndexedAccessType`(flow)
*/
function printIndexedAccessType(path, options, print) {
  return [
    print("objectType"),
    printOptionalToken(path),
    "[",
    print("indexType"),
    "]",
  ];
}

// `TSJSDocNullableType`, `TSJSDocNonNullableType`
function printJSDocType(path, print, token) {
  const { node } = path;
  return [
    node.postfix ? "" : token,
    printTypeAnnotationProperty(path, print),
    node.postfix ? token : "",
  ];
}

/*
- `TSRestType`(TypeScript)
- `TupleTypeSpreadElement`(flow)
*/
function printRestType(path, options, print) {
  const { node } = path;

  return [
    "...",
    ...(node.type === "TupleTypeSpreadElement" && node.label
      ? [print("label"), ": "]
      : []),
    print("typeAnnotation"),
  ];
}

/*
- `TSNamedTupleMember`(TypeScript)
- `TupleTypeLabeledElement`(flow)
*/
function printNamedTupleMember(path, options, print) {
  const { node } = path;

  return [
    // `TupleTypeLabeledElement` only
    node.variance ? print("variance") : "",
    print("label"),
    node.optional ? "?" : "",
    ": ",
    print("elementType"),
  ];
}

const typeAnnotationNodesCheckedLeadingComments = new WeakSet();
function printTypeAnnotationProperty(
  path,
  print,
  propertyName = "typeAnnotation"
) {
  const {
    node: { [propertyName]: typeAnnotation },
  } = path;

  if (!typeAnnotation) {
    return "";
  }

  let shouldPrintLeadingSpace = false;

  if (
    typeAnnotation.type === "TSTypeAnnotation" ||
    typeAnnotation.type === "TypeAnnotation"
  ) {
    const firstToken = path.call(getTypeAnnotationFirstToken, propertyName);

    if (
      firstToken === "=>" ||
      (firstToken === ":" &&
        hasComment(typeAnnotation, CommentCheckFlags.Leading))
    ) {
      shouldPrintLeadingSpace = true;
    }

    typeAnnotationNodesCheckedLeadingComments.add(typeAnnotation);
  }

  return shouldPrintLeadingSpace
    ? [" ", print(propertyName)]
    : print(propertyName);
}

const getTypeAnnotationFirstToken = (path) => {
  if (
    // TypeScript
    path.match(
      (node) => node.type === "TSTypeAnnotation",
      (node, key) =>
        (key === "returnType" || key === "typeAnnotation") &&
        (node.type === "TSFunctionType" || node.type === "TSConstructorType")
    )
  ) {
    return "=>";
  }

  if (
    // TypeScript
    path.match(
      (node) => node.type === "TSTypeAnnotation",
      (node, key) =>
        key === "typeAnnotation" &&
        (node.type === "TSJSDocNullableType" ||
          node.type === "TSJSDocNonNullableType" ||
          node.type === "TSTypePredicate")
    ) ||
    /*
    Flow

    ```js
    declare function foo(): void;
                        ^^^^^^^^ `TypeAnnotation`
    ```
    */
    path.match(
      (node) => node.type === "TypeAnnotation",
      (node, key) => key === "typeAnnotation" && node.type === "Identifier",
      (node, key) => key === "id" && node.type === "DeclareFunction"
    )
  ) {
    return "";
  }

  return ":";
};

/*
- `TSTypeAnnotation` (TypeScript)
- `TypeAnnotation` (Flow)
*/
function printTypeAnnotation(path, options, print) {
  // We need print space before leading comments,
  // `printTypeAnnotationProperty` is responsible for it.
  /* c8 ignore start */
  if (process.env.NODE_ENV !== "production") {
    const { node } = path;

    if (!typeAnnotationNodesCheckedLeadingComments.has(node)) {
      throw Object.assign(
        new Error(
          `'${node.type}' should be printed by '${printTypeAnnotationProperty.name}' function.`
        ),
        { parentNode: path.parent, propertyName: path.key }
      );
    }
  }
  /* c8 ignore stop */

  const token = getTypeAnnotationFirstToken(path);
  return token
    ? [token, " ", print("typeAnnotation")]
    : print("typeAnnotation");
}

export {
  printTypeAlias,
  printIndexedAccessType,
  shouldHugType,
  printJSDocType,
  printRestType,
  printNamedTupleMember,
  printTypeAnnotationProperty,
  printTypeAnnotation,
};
