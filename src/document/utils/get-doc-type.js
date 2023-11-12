import {
  DOC_TYPE_STRING,
  DOC_TYPE_ARRAY,
  VALID_OBJECT_DOC_TYPES,
} from "../constants.js";

/**
 * @typedef {import("../builders.js").Doc} Doc
 * @typedef {import("../constants.js").DocTypes} DocTypes
 */

/**
 * @param {Doc} doc
 * @returns {DocTypes | void}
 */
function getDocType(doc) {
  if (typeof doc === "string") {
    return DOC_TYPE_STRING;
  }

  if (Array.isArray(doc)) {
    return DOC_TYPE_ARRAY;
  }

  if (!doc) {
    return;
  }

  const { type } = doc;

  if (VALID_OBJECT_DOC_TYPES.has(type)) {
    return type;
  }
}

export default getDocType;
