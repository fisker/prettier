import stringify from "fast-json-stable-stringify";
import { format, getSupportInfo } from "../index.js";
import { omit, printToScreen } from "./utilities.js";

const sortByName = (array) =>
  array.sort((firstItem, secondItem) => firstItem.name.localeCompare(secondItem.name));

async function printSupportInfo() {
  const { languages, options } = await getSupportInfo();
  const supportInfo = {
    languages: sortByName(languages),
    options: sortByName(options).map((option) =>
      omit(option, ["cliName", "cliCategory", "cliDescription"]),
    ),
  };

  const result = await format(stringify(supportInfo), { parser: "json" });

  printToScreen(result.trim());
}

export default printSupportInfo;
