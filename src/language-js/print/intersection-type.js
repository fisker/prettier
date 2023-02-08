import { group, line, indent } from "../../document/builders.js";
import { isObjectType } from "../utils/index.js";

// `TSIntersectionType` and `IntersectionTypeAnnotation`
function printIntersectionType(path, options, print) {
  const { node } = path;
  const types = path.map(print, "types");
  const result = [];
  let wasIndented = false;
  for (let i = 0; i < types.length; ++i) {
    if (i === 0) {
      result.push(types[i]);
    } else if (isObjectType(node.types[i - 1]) && isObjectType(node.types[i])) {
      // If both are objects, don't indent
      result.push([" & ", wasIndented ? indent(types[i]) : types[i]]);
    } else if (
      !isObjectType(node.types[i - 1]) &&
      !isObjectType(node.types[i])
    ) {
      // If no object is involved, go to the next line if it breaks
      result.push(indent([" &", line, types[i]]));
    } else {
      // If you go from object to non-object or vis-versa, then inline it
      if (i > 1) {
        wasIndented = true;
      }
      result.push(" & ", i > 1 ? indent(types[i]) : types[i]);
    }
  }
  return group(result);
}

export { printIntersectionType };
