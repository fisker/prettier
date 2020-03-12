"use strict";

module.exports = function(ast, newNode) {
  delete newNode.sourceSpan;
  delete newNode.startSourceSpan;
  delete newNode.endSourceSpan;
  delete newNode.nameSpan;
  delete newNode.valueSpan;

  if (ast.type === "text" || ast.type === "comment") {
    return;
  }

  // may be formatted by multiparser
  if (ast.type === "yaml" || ast.type === "toml") {
    return;
  }

  if (ast.type === "attribute") {
    delete newNode.value;
  }

  if (ast.type === "docType") {
    delete newNode.value;
  }
};
