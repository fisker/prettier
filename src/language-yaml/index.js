import createGetVisitorKeys from "../utils/create-get-visitor-keys.js";
import languages from "./languages.evaluate.js";
import embed from "./embed.js";
import parse from "./parse.js";
import print from "./print.js";
import { locStart, locEnd } from "./loc.js";
import { hasPragma, insertPragma } from "./pragma.js";
import massageAstNode from "./clean.js";
import beforePrint from "./print-preprocess.js";
import visitorKeys from "./visitor-keys.js";

const getVisitorKeys = createGetVisitorKeys(visitorKeys);

export default [
  {
    name: "yaml",
    languages,
    embed,
    parse,
    print,
    locStart,
    locEnd,
    beforePrint,
    massageAstNode,
    getVisitorKeys,
    insertPragma,
    hasPragma,
  },
];
