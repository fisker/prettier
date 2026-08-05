type Foo1 = (
  | "thing1" // Comment1
  | "thing2" // Comment2
)[]; // Final comment1

type Foo2 = (
  | "thing1" // Comment1
  | "thing2" // Comment2
) & Bar; // Final comment2

type Foo3 = (
  | "thing1" // Comment1
  | "thing2" // Comment2
) | Bar; // Final comment2
