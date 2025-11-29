// Issue #18246: Prevent ugly breaks in member expressions used as superClass

// Original issue - long class name with member expression superClass
class EnsureNoDisposablesAreLeakedInTestSuiteSuite extends eslint.Rule.RuleModule {};

// Short case - should stay on one line
class A extends B.C {};

// Deep member expression
class VeryLongClassName extends deeply.nested.member.expression.RuleModule {};

// Non-member expression - should not be affected
class LongClassName extends SomeSuperClass {};

// Class expression in assignment
foo = class extends aaaaaaaa.bbbbbbbb.cccccccc.dddddddd.eeeeeeee.ffffffff.gggggggg2 {
  method() {}
};
