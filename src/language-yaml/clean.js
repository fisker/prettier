import { isPragma } from "./pragma.js";

function clean(original, cloned /* , parent */) {
  switch (original.type) {
    case "comment":
      // insert pragma
      if (isPragma(original.value)) {
        return null;
      }
      break;
    case "quoteDouble":
    case "quoteSingle":
      cloned.type = "quote";
      break;
    case "blockLiteral":
    case "blockFolded":
      // Remove trailing whitespace from each line
      cloned.value = cloned.value
        .split("\n")
        .map((line) => line.replace(/[ \t]+$/u, ""))
        .join("\n");
      break;
    case "document":
      // We may insert explicit marks
      if (!cloned.directivesEndMarker) {
        delete cloned.directivesEndMarker;
      }
      if (!cloned.documentEndMarker) {
        delete cloned.documentEndMarker;
      }
      break;
  }
}
clean.ignoredProperties = new Set(["position"]);

export default clean;
