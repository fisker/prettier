import { group } from "../../document/builders.js";
import { hasSameLocStart } from "../loc.js";
import { isObjectTypePropertyAFunction } from "../utils/index.js";
import {
  printFunctionParameters,
  shouldGroupFunctionParameters,
} from "./function-parameters.js";
import { printTypeAnnotationProperty } from "./type-annotation.js";

/*
`FunctionTypeAnnotation` is ambiguous:
- `declare function foo(a: B): void;`
- `var A: (a: B) => void;`
*/
function isFlowArrowFunctionTypeAnnotation(path) {
  const { node, parent } = path;
  return (
    node.type === "FunctionTypeAnnotation" &&
    (isObjectTypePropertyAFunction(parent) ||
      !(
        ((parent.type === "ObjectTypeProperty" ||
          parent.type === "ObjectTypeInternalSlot") &&
          !parent.variance &&
          !parent.optional &&
          hasSameLocStart(parent, node)) ||
        parent.type === "ObjectTypeCallProperty" ||
        path.getParentNode(2)?.type === "DeclareFunction"
      ))
  );
}

/*
- `TSFunctionType` (TypeScript)
- `TSCallSignatureDeclaration` (TypeScript)
- `TSConstructorType` (TypeScript)
- `TSConstructSignatureDeclaration` (TypeScript)
- `FunctionTypeAnnotation` (Flow)
*/
function printFunctionType(path, options, print) {
  const { node } = path;
  const parts = [];

  if (node.type === "TSConstructorType" && node.abstract) {
    parts.push("abstract ");
  }

  if (
    node.type === "TSConstructorType" ||
    node.type === "TSConstructSignatureDeclaration"
  ) {
    parts.push("new ");
  }

  let parametersDoc = printFunctionParameters(
    path,
    print,
    options,
    /* expandArg */ false,
    /* printTypeParams */ true
  );

  const returnTypeDoc = [];
  // `flow` doesn't wrap the `returnType` with `TypeAnnotation`, so the colon
  // needs to be added separately.
  if (node.type === "FunctionTypeAnnotation") {
    returnTypeDoc.push(
      isFlowArrowFunctionTypeAnnotation(path) ? " => " : ": ",
      print("returnType")
    );
  } else {
    returnTypeDoc.push(
      printTypeAnnotationProperty(
        path,
        print,
        node.returnType ? "returnType" : "typeAnnotation"
      )
    );
  }

  if (shouldGroupFunctionParameters(node, returnTypeDoc)) {
    parametersDoc = group(parametersDoc);
  }

  parts.push(parametersDoc, returnTypeDoc);

  return group(parts);
}

export { printFunctionType };
