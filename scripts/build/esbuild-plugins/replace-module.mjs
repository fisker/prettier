import { createRequire } from "node:module";
import path from "node:path";
import url from "node:url";

export default function (replacements = {}) {
  return {
    name: "replaceModules",
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (!args.importer || args.kind !== "require-call") return;

        const importee = createRequire(args.importer).resolve(args.path);
        if (!Reflect.has(replacements, importee)) {
          return;
        }

        return {
          path: replacements[importee],
          external: true,
          namespace: "replaceModules",
        };

        // const importee =args.path;
        //       if (!Reflect.has(replacements, importee)) {
        //         return;
        //       }

        //       let replacement = replacements[importee];

        //       if (typeof replacement === "string") {
        //         replacement={code:`export default require(${JSON.stringify(replacement)});`} ;
        //       }

        //       return {
        // contents: replacement.code,
        // loader: 'text'
        // }
      });
    },
  };
}
