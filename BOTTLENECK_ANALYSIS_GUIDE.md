# Bottleneck Analysis Guide

## Quick Start

To identify performance bottlenecks when formatting JavaScript files:

```bash
yarn debug test.js --debug-perf-profile --log-level=debug
```

## What This Shows

The `--debug-perf-profile` flag measures three key phases:

1. **Parse** - Converting source code into an Abstract Syntax Tree (AST)
2. **AST to Doc** - Converting AST to Prettier's document representation 
   - With detailed breakdown of sub-phases
3. **Print Doc** - Converting document to formatted string

## Example Output

```
[debug] '--debug-perf-profile' measurements:
[debug]   Parse:        26.2ms
[debug]   AST to Doc:   19.1ms
[debug]   Print Doc:    2.5ms
[debug]   Total:        47.8ms
[debug] 
[debug]   AST to Doc breakdown:
[debug]     Attach comments:  2.1ms  (11%)
[debug]     Preprocess:       0.0ms  (0%)
[debug]     Prepare to print: 2.2ms  (12%)
[debug]     Embedded langs:   1.5ms  (8%)
[debug]     Main print:       15.0ms (79%)  ← Primary bottleneck
```

## Interpreting Results

### What the Numbers Mean

- **Parse time** includes reading the file and parsing it into an AST
- **AST to Doc time** includes traversing the AST and applying formatting rules
  - **Attach comments**: Associating comments with AST nodes
  - **Preprocess**: Running printer-specific preprocessing (usually minimal)
  - **Prepare to print**: Overall setup overhead
  - **Embedded langs**: Processing JSX and other embedded languages
  - **Main print**: Core AST traversal and printer function calls (the real bottleneck)
- **Print Doc time** includes converting the document back to a string

### Current Bottleneck

Based on extensive testing:
- **AST to Doc is the bottleneck**, taking 60-70% of total time
- **Within AST to Doc, Main print is the bottleneck**, taking ~80-85% of that phase

This means the main bottleneck is in:
- `src/main/ast-to-doc.js` - The mainPrint recursion
- `src/language-js/print/*.js` - The printer functions called for each node type

### Why This Matters

Understanding where time is spent helps prioritize optimization efforts:

- ✅ **Highest priority:** Optimize printer functions in `src/language-js/print/`
- ✅ **High priority:** Optimize AST traversal in `src/main/ast-to-doc.js`
- ⚠️ Parser optimization has limited impact (only ~20-30% of time)
- ⚠️ Comment handling is already reasonably optimized (~10-12%)
- ⚠️ Print Doc is already well optimized (~7-15%)

## Testing Different Parsers

Compare parser performance:

```bash
# Test with Meriyah (default, fastest)
yarn debug test.js --debug-perf-profile --log-level=debug

# Test with Babel
yarn debug test.js --debug-perf-profile --log-level=debug --parser=babel

# Test with Espree
yarn debug test.js --debug-perf-profile --log-level=debug --parser=espree
```

## Comparing Before/After Optimization

When making performance optimizations:

1. Create a test file
2. Run with `--debug-perf-profile` to get baseline
3. Make your changes
4. Run again and compare results
5. Focus on reducing Main print time within AST-to-Doc

## Next Steps for Optimization

Based on the breakdown, here's what to investigate:

1. **Profile specific printer functions** - Use Node.js profiler to identify hot paths
2. **Check frequently called printers** - `object.js`, `function.js`, `call-expression.js`, etc.
3. **Optimize document creation** - Reduce object allocations in frequently called printers
4. **Optimize AST traversal** - Check if the mainPrint recursion can be improved

## See Also

- [PERFORMANCE_ANALYSIS.md](./PERFORMANCE_ANALYSIS.md) - Detailed analysis and recommendations
- [commands.md](./commands.md) - All available commands
