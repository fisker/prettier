import isNonEmptyArray from "../../utilities/is-non-empty-array.js";

function hasSCSSInterpolation(groupList) {
  if (isNonEmptyArray(groupList)) {
    for (let groupIndex = groupList.length - 1; groupIndex > 0; groupIndex--) {
      // If we find `#{`, return true.
      if (
        groupList[groupIndex].type === "word" &&
        groupList[groupIndex].value === "{" &&
        groupList[groupIndex - 1].type === "word" &&
        groupList[groupIndex - 1].value.endsWith("#")
      ) {
        return true;
      }
    }
  }
  return false;
}

export default hasSCSSInterpolation;
