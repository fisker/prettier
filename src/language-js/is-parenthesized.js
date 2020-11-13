"use strict";
const { locStart, locEnd } = require("./loc");

function getTokens(options) {
  return options[Symbol.for("tokens")];
}

// https://github.com/mysticatea/eslint-utils/blob/master/src/is-parenthesized.js
function getTokenBefore(node, options, filter) {
  const tokens = getTokens(options);
  const start = locStart(node);
  for (let index = tokens.length - 1; index >= 0; index--) {
    const token = tokens[index];
    if ((!filter || filter(token)) && locEnd(token) <= start) {
      return token;
    }
  }
}
function getTokenAfter(node, options, filter) {
  const tokens = getTokens(options);
  const end = locEnd(node);
  for (const token of tokens) {
    if ((!filter || filter(token)) && locStart(token) >= end) {
      return token;
    }
  }
}
function getFirstToken(node, options, skip) {
  const tokens = getTokens(options);
  const start = locStart(node);
  for (const [index, token] of tokens.entries()) {
    if (locStart(token) > start) {
      return tokens[index + skip];
    }
  }
}
function isOpeningParenthesisToken(token, options) {
  return (
    token &&
    // babel
    ((token.type && token.type.label === "(") ||
      // flow
      (token.type === "T_LPAREN" && token.value === "(") ||
      // typescript espree
      (token.type === "Punctuator" && token.value === "(") ||
      // meriyah
      (token.token === "Punctuator" &&
        options.originalText.charAt(token.start) === "("))
  );
}
function isClosingParenthesisToken(token, options) {
  return (
    token &&
    // babel
    ((token.type && token.type.label === ")") ||
      // flow
      (token.type === "T_RPAREN" && token.value === ")") ||
      // typescript espree
      (token.type === "Punctuator" && token.value === ")") ||
      // meriyah
      (token.token === "Punctuator" &&
        options.originalText.charAt(token.start) === ")"))
  );
}
function getParentSyntaxParenthesis(path, options) {
  const node = path.getValue();
  const parent = path.getParentNode();
  switch (parent.type) {
    case "CallExpression":
    case "NewExpression":
      if (parent.arguments.length === 1 && parent.arguments[0] === node) {
        return getTokenAfter(parent.callee, options, (token) =>
          isOpeningParenthesisToken(token, options)
        );
      }
      break;
    case "DoWhileStatement":
      if (parent.test === node) {
        return getTokenAfter(parent.body, options, (token) =>
          isClosingParenthesisToken(token, options)
        );
      }
      break;
    case "IfStatement":
    case "WhileStatement":
      if (parent.test === node) {
        return getFirstToken(parent, options, 1);
      }
      break;
    case "ImportExpression":
      if (parent.source === node) {
        return getFirstToken(parent, options, 1);
      }
      break;
    case "SwitchStatement":
      if (parent.discriminant === node) {
        return getFirstToken(parent, options, 1);
      }
      break;
    case "WithStatement":
      if (parent.object === node) {
        return getFirstToken(parent, options, 1);
      }
      break;
  }
}
function isParenthesized(path, options) {
  const node = path.getValue();
  const tokenBefore = getTokenBefore(node, options);
  const tokenAfter = getTokenAfter(node, options);

  return (
    isOpeningParenthesisToken(tokenBefore, options) &&
    isClosingParenthesisToken(tokenAfter, options) &&
    tokenBefore !== getParentSyntaxParenthesis(path, options)
  );
}

module.exports = isParenthesized;
