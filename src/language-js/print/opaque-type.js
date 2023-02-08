
import {  printDeclareToken } from "./misc.js";

/*
- `DeclareOpaqueType`(flow)
- `OpaqueType`(flow)
*/
function printOpaqueType(path, options, print) {
  const semi = options.semi ? ";" : "";
  const { node } = path;
  const parts = [
    printDeclareToken(path),
    "opaque type ",
    print("id"),
    print("typeParameters"),
  ];

  if (node.supertype) {
    parts.push(": ", print("supertype"));
  }

  if (node.impltype) {
    parts.push(" = ", print("impltype"));
  }

  parts.push(semi);

  return parts;
}

export {printOpaqueType }
