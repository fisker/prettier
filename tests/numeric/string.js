// `\XXX` (where XXX is 1–3 octal digits; range of 0–377)
"a\9a";
"a\99a";
"a\377a";
"a\378a";
"a\\9a";
"a\\99a";
"a\\377a";
"a\\378a";
"a\\\9a";
"a\\\99a";
"a\\\377a";
"a\\\378a";

// `\uXXXX` (where XXXX is 4 hex digits; range of 0x0000–0xFFFF)
"a\u0000a";
"a\uffFfa";
"a\\u0000a";
"a\\uffFfa";
"a\\\u0000a";
"a\\\uffFfa";

// `\u{X} ... \u{XXXXXX}` (where X…XXXXXX is 1–6 hex digits; range of 0x0–0x10FFFF)
"a\u{0}a";
"a\u{f}a";
"a\u{fF}a";
"a\u{fFf}a";
"a\u{fFfF}a";
"a\u{fFfFf}a";
"a\u{10FFFF}a";
"a\\u{0}a";
"a\\u{f}a";
"a\\u{fF}a";
"a\\u{fFf}a";
"a\\u{fFfF}a";
"a\\u{fFfFf}a";
"a\\u{10FFFF}a";
"a\\\u{0}a";
"a\\\u{f}a";
"a\\\u{fF}a";
"a\\\u{fFf}a";
"a\\\u{fFfF}a";
"a\\\u{fFfFf}a";
"a\\\u{10FFFF}a";

// `\xXX` (where XX is 2 hex digits; range of 0x00–0xFF)
"a\xfFa";
"a\\xfFa";
"a\\\xfFa";
