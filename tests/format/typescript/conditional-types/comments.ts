type A1 = B extends T
  ? // comment
    foo
  : bar;

type A2 = B extends test /* comment
  comment
      comment
*/
  ? foo
  : bar;

type T1 = test extends B
  ? /* comment
          comment
    comment
          comment
  */
    foo
  : bar;

type T2 = test extends B
  ? /* comment
       comment
       comment
       comment
    */
    foo
  : test extends B
  ? /* comment
  comment
    comment */
    foo
  : bar;

type T3 = test extends B
  ? /* comment */
    foo
  : bar;

type T4 = test extends B
  ? foo
  : /* comment
         comment
     comment
           comment
    */
  bar;

type T5 = test extends B
  ? foo
  : /* comment
         comment
     comment
           comment
    */
  test extends B
  ? foo
  : /* comment
  comment
    comment
   */
    bar;

type T6 = test extends B
  ? foo
  : /* comment */
  bar;

type T7 = test extends B ? test extends B /* c
c */? foo : bar : bar;

type T8 = any extends B
    // Comment
    // Multiline comment
    ? B | C
    : D;
T = any instanceof B
    // Comment
    // Multiline comment
    ? B | C
    : D;
T = any instanceof B
    ? D
    // Comment
    // Multiline comment
    : B | C;

type T9 = any extends B
    // Comment
    ? B | C
    : D;
T = any instanceof B
    // Comment
    ? B | C
    : D;

type T10 = any extends B
  /**
  * Comment
  */
    ? B | C
    : D;
T = any instanceof B
  /**
  * Comment
  */
    ? B | C
    : D;
type T11 = any extends B
  ?/* Comment */
     B | C
    : D;
T = any instanceof B
  ?/* Comment */
     B | C
    : D;
