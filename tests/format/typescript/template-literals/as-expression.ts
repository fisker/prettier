const a = `${(foo + bar) as baz}`;
const b = `${(veryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLongFoo + bar) as baz}`;
const c = `${(foo + veryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLongBar) as baz}`;
const d = `${(foo + bar) as veryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLongBaz}`;
const e = `${(veryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLongFoo + veryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLongBar) as veryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLongBaz}`;
