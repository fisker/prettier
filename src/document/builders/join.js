import { assertDoc, assertDocArray } from "../utilities/assert-doc.js";

/**
@import {Doc} from "./index.js";
*/

/**
@param {Doc} separator
@param {Doc[]} docs
@returns {Doc[]}
*/
function join(separator, docs) {
  assertDoc(separator);
  assertDocArray(docs);

  const parts = [];

  for (let docIndex = 0; docIndex < docs.length; docIndex++) {
    if (docIndex !== 0) {
      parts.push(separator);
    }
    parts.push(docs[docIndex]);
  }

  return parts;
}

export { join };
