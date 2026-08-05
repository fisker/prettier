const {
  foo11,
  // bar
  // baz
}: Foo = expr;

const {
  foo21,
  // bar
  foo22,
  // baz
}: Foo = expr;

const [
  foo12,
  // bar
  // baz
]: Foo = expr;

const [
  foo31,
  // bar
  foo32,
  // baz
]: Foo = expr;

function method({
  foo,
  // bar = "bar",
  // bazz = "bazz",
}: Foo) {}

function method({
  foo1,
  // bar = "bar",
  foo2
  // bazz = "bazz",
}: Foo) {}

function method([
  foo,
  // bar = "bar",
  foo2
  // bazz = "bazz",
]: Foo) {}

const {
  // bar
  // baz
}: Foo = expr;

const [
  // bar
  // baz
]: Foo = expr;
