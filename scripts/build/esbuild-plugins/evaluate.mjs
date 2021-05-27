import createEsmUtils from "esm-utils";
const { require } = createEsmUtils(import.meta);

export default function () {
  return {
    name: "evaluate",

    setup(build) {
      build.onLoad({ filter: /\.evaluate\.js$/ }, (args) => {
        const json = JSON.stringify(require(args.path), (_, v) => {
          if (typeof v === "function") {
            throw new Error("Cannot evaluate functions.");
          }
          return v;
        });

        return {
          contents: json,
          loader: "json",
        };
      });
    },
  };
}
