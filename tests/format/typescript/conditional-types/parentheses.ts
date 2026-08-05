// #13275
type Foo1<T> = T extends ((...a: any[]) => infer R extends string) ? R : never;
type Foo2<T> = T extends (new (...a: any[]) => infer R extends string) ? R : never;

// #14275
type Test1<T> = T extends ((
  token: TSESTree.Token
) => token is infer U extends TSESTree.Token)
  ? U
  : TSESTree.Token;
type Test2<T> = T extends ((
  token: TSESTree.Token
) => asserts token is infer U extends TSESTree.Token)
  ? U
  : TSESTree.Token;
type Test3<T> = T extends (new (
  token: TSESTree.Token
) => token is infer U extends TSESTree.Token)
  ? U
  : TSESTree.Token;
