interface Foo1 {
  get foo(): string;
  set bar(v);
}

type Foo2 = {
  get foo(): string;
  set bar(v);
}

interface Foo3 {
  set bar(foo: string);
}
