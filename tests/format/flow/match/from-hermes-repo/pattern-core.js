/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// RUN: %hermesc -parse-flow -Xparse-flow-match -dump-ast -pretty-json %s | %FileCheck %s --match-full-lines

// CHECK-LABEL: {
// CHECK-NEXT:   "type": "Program",
// CHECK-NEXT:   "body": [

const e = match (x) {
  "s": 1,
  true: 1,
  null: 1,
  3: 1,
  4n: 1,
  +5: 1,
  -6: 1,
  +7n: 1,
  -8n: 1,
  y: 1,
  const y: y,
  let y: y,
  var y: y,
  ('s'): 1,
  _: 1,
};
