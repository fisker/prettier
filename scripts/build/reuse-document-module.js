import path from "node:path";
import url from "node:url";
import outdent from "outdent";
import partition from "../../src/utils/partition.js";
import * as publicApis from "../../src/document/public.js";
import docBuilder from "../../src/document/builders.js";
import docPrinter from "../../src/document/printer.js";
import docUtils from "../../src/document/utils.js";
import docDebug from "../../src/document/debug.js";
import { PROJECT_ROOT } from "../utils/index.mjs";

async function reuseDocumentModule() {
  const publicApis = {};
  const privateApis = [];

  let text = "";
  for (const [name, module] of Object.entries(publicApis)) {
    const file = path.join(PROJECT_ROOT, `src/document/${moduleName}.js`);
    const exports = await import(url.pathToFileURL(file));
    const [modulePublicApis, modulePrivateApis] = partition(
      Object.entries(exports),
      ([specifier, value]) => module[specifier] === value
    );

    if (modulePublicApis.length > 0) {
      publicApis[name] = modulePublicApis.map(([specifier]) => specifier);
    }
    if (modulePrivateApis.length > 0) {
      privateApis[name] = modulePrivateApis.map(([specifier]) => specifier);
    }
  }

  // return Object.entries(doc).map(([name, module]) => ({
  //   module: path.join(PROJECT_ROOT, `src/document/${name}.js`),
  //   text: outdent`
  //     import {${name}} from "./index.js";

  //     export const {
  //     ${Object.keys(module)
  //       .map((specifier) => `  ${specifier},`)
  //       .join("\n")}
  //     } = ${name};
  //   `,
  // }));
}

export default reuseDocumentModule;
