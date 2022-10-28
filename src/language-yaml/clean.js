import { isPragma } from "./pragma.js";
import { isNode } from "./utils.js";

function clean(node, newNode /*, parent */) {
  if (isNode(newNode)) {
    delete newNode.position;
    switch (newNode.type) {
      case "comment":
        // insert pragma
        if (isPragma(newNode.value)) {
          return null;
        }
        break;
      case "quoteDouble":
      case "quoteSingle":
        newNode.type = "quote";
        break;
    }
  }
}

export default clean;
