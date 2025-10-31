// Use the well-maintained string-width package from sindresorhus
// https://github.com/sindresorhus/string-width
// This package handles:
// - East Asian fullwidth and wide characters
// - ANSI escape code stripping (configurable)
// - Ambiguous width characters (treats as narrow by default)
// - Control characters, combining characters, variation selectors
export { default } from "string-width";
