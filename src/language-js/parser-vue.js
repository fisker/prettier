"use strict";

const locFns = require("./loc");
const postprocess = require("./postprocess");

function parseExpression(text, parsers, options) {
  const { parse } = require("vue-eslint-parser");
  let ast = parse(`<template>{{\n ${text} \n}}</template>`);
  ast = postprocess(ast, { ...options, originalText: text });

  const {templateBody} = ast;
  const {errors, comments} = templateBody;
  if (errors.length) {
    throw errors[0]
  }

  const { expression } = templateBody.children[0];
  expression.comments = comments;
  return expression;
}

module.exports = {
  parsers: {
    __vue_expression: {
      astFormat: "estree",
      parse: parseExpression,
      ...locFns,
    },
  },
};
