// Issue #18144 - should not add extra empty line when update is missing
for (
  let i = 0, j = 0, len = allMatches.length, lenJ = selections.length;
  i < len;
) {}

// With update for comparison
for (
  let i = 0, j = 0, len = allMatches.length, lenJ = selections.length;
  i < len;
  i++
) {}

// Short form without update
for (var i = 0; i < 10;) {}

// All parts missing
for (;;) {}

// Only init present
for (var i = 0;;) {}

// Only test present
for (; i < 10;) {}

// Only update present
for (;; i++) {}
