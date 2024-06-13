// Docs: https://docusaurus.io/docs/en/site-config.html

import path from "node:path";
import fs from "node:fs";
// const { load: parseYaml } = require("js-yaml");

const PACKAGE = require("../package.json");
const GITHUB_URL = `https://github.com/${PACKAGE.repository}`;

// function loadYaml(fsPath) {
//   return parseYaml(fs.readFileSync(path.join(__dirname, fsPath), "utf8"));
// }

// const users = loadYaml("./data/users.yml");
// const editors = loadYaml("./data/editors.yml");
// const supportedLanguages = loadYaml("./data/languages.yml");

const siteConfig = {
  // Required fields
  title: "Prettier",
  url: PACKAGE.homepage,
  baseUrl: "/",

  // Optional fields
  favicon: "icon.png",
  projectName: PACKAGE.name,

  tagline: "Opinionated Code Formatter",
  // githubUrl: GITHUB_URL,
  // repo: PACKAGE.repository,
  // users,
  // editors,
  // supportedLanguages,
  // tideliftUrl:
  //   "https://tidelift.com/subscription/pkg/npm-prettier?utm_source=npm-prettier&utm_medium=referral&utm_campaign=website",
  // /* colors for website */
  //       colors: {
  //         primaryColor: "#1A2B34",
  //         secondaryColor: "#808080",
  //       },
  // useEnglishUrl: true,
  scripts: [
    "https://buttons.github.io/buttons.js",
    "https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js",
    "/js/code-block-buttons.js",
  ],
  stylesheets: [
    "//unpkg.com/@sandhose/prettier-animated-logo@1.0.3/dist/wide.css",
  ],
  // markdownPlugins: [
  //   // ignore `<!-- prettier-ignore -->` before passing into Docusaurus to avoid mis-parsing (#3322)
  //   (md) => {
  //     md.block.ruler.before(
  //       "htmlblock",
  //       "prettierignore",
  //       (state, startLine) => {
  //         const pos = state.bMarks[startLine];
  //         const max = state.eMarks[startLine];
  //         if (/<!-- prettier-ignore -->/.test(state.src.slice(pos, max))) {
  //           state.line += 1;
  //           return true;
  //         }
  //         return false;
  //       },
  //     );
  //   },
  // ],
  // separateCss: ["static/separate-css"],
  // twitter: true,
  // twitterUsername: "PrettierCode",
  // onPageNav: "separate",
  markdown: { format: "detect" },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        theme: {
          customCss: [
            require.resolve("./static/overrides.css"),
            require.resolve("./static/prism.css"),
          ],
        },
        docs: {
          routeBasePath: "/docs/en/",
          path: "../docs",
          /* base url for editing docs, usage example: editUrl + 'en/doc1.md' */
          editUrl: `${GITHUB_URL}/edit/main/docs/`,
        },
        googleAnalytics: {
          trackingID: "UA-111350464-1",
        },
      },
    ],
  ],
  themeConfig: {
    footer: {
      logo: {
        src: "icon.png",
      },
    },
    image: "icon.png",
    navbar: {
      title: "Prettier",
      logo: { src: "icon.png" },
      items: [
        { to: "/playground/", label: "Playground", position: "right" },
        { to: "docs", label: "Docs", position: "right" },
        { to: "blog", label: "Blog", position: "right" },
        // { search: true },
        {
          to: "https://opencollective.com/prettier",
          label: "Donate",
          position: "right",
        },
        { to: GITHUB_URL, label: "GitHub", position: "right" },
      ],
    },
    algolia: {
      appId: "FPHG9L4N9A",
      apiKey: "3d7c2d9a78a279ff660c191985737dfd",
      indexName: "prettier1",
    },
    prism: {
      theme: {
        plain: {},
        styles: [],
      },
    },
  },
};

module.exports = siteConfig;
