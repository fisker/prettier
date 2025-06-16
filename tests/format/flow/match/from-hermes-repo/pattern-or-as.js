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
  "s" | true | null: 1,
  {foo: 1 | 2}: 2,
  {foo: [1] as y}: y,
  {foo: 1 | 2 | 3 as y}: y,
  {foo: (1 | 2 | 3) as y}: y,
  {foo: [1] as const y}: y,
};
