// Issue #18246: Prevent ugly breaks in member expressions in heritage clauses

// Long class name with member expression in implements
class EnsureNoDisposablesAreLeakedInTestSuiteSuite implements eslint.Rule.RuleModule {};

// Short case - should stay on one line
class A implements B.C {};

// Deep member expression
class VeryLongClassName implements deeply.nested.member.expression.RuleModule {};

// Multiple implements with member expressions
class MyClass implements A.B, C.D {};

// Both extends and implements with member expressions
class MyLongClass extends Some.Base implements Another.Interface {};

// Class expression in assignment
bar = class implements aaaaaaaa.bbbbbbbb.cccccccc.dddddddd.eeeeeeee.ffffffff.gggggggg2 {
  method() {}
};

// Interface with extends
interface VeryLongInterfaceName extends some.deeply.nested.member.expression.Interface {}
