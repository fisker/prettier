# AST-to-Doc Bottleneck Analysis Summary

## Question
"What are the bottlenecks in `AST to Doc`? How can we improve?"

## Answer

### The Bottleneck Within AST-to-Doc

I've added detailed profiling that breaks down the AST-to-Doc phase into sub-phases. The analysis reveals:

**AST-to-Doc Sub-Phase Breakdown:**
- **Main print: ~80-85%** ← THE REAL BOTTLENECK
- Prepare to print: ~10-12%
- Embedded languages: ~5-10% (when JSX/embedded code present)
- Attach comments: ~5%
- Preprocess: <1%

**Example output:**
```
[debug]   AST to Doc breakdown:
[debug]     Attach comments:  2.6ms  (5%)
[debug]     Preprocess:       0.0ms  (0%)
[debug]     Prepare to print: 2.8ms  (5%)
[debug]     Embedded langs:   5.3ms  (10%)
[debug]     Main print:       42.8ms (84%)  ← Primary bottleneck
```

### What is "Main Print"?

Main print is the core AST traversal and printer function execution loop in `src/main/ast-to-doc.js`. It includes:
1. **Recursive AST traversal** - The mainPrint function walking through every node
2. **Printer function calls** - Calling printer functions in `src/language-js/print/*.js` for each node
3. **Document creation** - Building the intermediate doc structure
4. **Comment integration** - Printing comments alongside nodes

Since this accounts for ~80-85% of AST-to-Doc time (and ~50-60% of total formatting time), this is where optimization efforts should focus.

## How to Improve

### Immediate Actions (High ROI)

1. **Profile Hot Printer Functions**
   - Use Node.js profiler (`node --prof`) or Chrome DevTools to identify frequently called printers
   - Likely hot paths: `object.js`, `function.js`, `call-expression.js`, `member.js`, `binaryish.js`
   - These handle the most common JavaScript constructs

2. **Optimize Top 5-10 Printer Functions**
   - Reduce object allocations in printer functions
   - Cache computed values within a print call
   - Avoid redundant checks/operations
   - Use simpler document construction when possible

3. **Optimize AST Traversal**
   - Profile the `mainPrint` recursion overhead in `src/main/ast-to-doc.js`
   - Consider optimizing the AstPath data structure
   - Reduce function call overhead
   - Optimize the cache lookup logic

### Specific Code Locations to Investigate

**High Priority:**
- `src/language-js/print/index.js` - Main dispatcher, called for every node
- `src/language-js/print/object.js` - Objects are everywhere in JS
- `src/language-js/print/call-expression.js` - Function calls are common
- `src/language-js/print/member.js` - Member access is very common
- `src/language-js/print/function.js` - Function definitions
- `src/main/ast-to-doc.js` - The mainPrint/mainPrintInternal functions

**Medium Priority:**
- `src/language-js/print/binaryish.js` - Binary expressions
- `src/language-js/print/jsx.js` - JSX overhead (when present)
- `src/document/builders.js` - Document creation operations

### Optimization Strategies

1. **Micro-optimizations in Hot Paths**
   ```javascript
   // Before: Creating objects on each call
   return {
     type: "group",
     contents: doc
   };
   
   // After: Reuse objects or use simpler structures
   return ["(", doc, ")"];  // When simple concatenation suffices
   ```

2. **Reduce Object Allocations**
   - Preallocate arrays when size is known
   - Avoid creating temporary objects in loops
   - Use string concatenation instead of arrays for simple cases

3. **Cache Computed Values**
   - Don't recompute node properties multiple times
   - Cache parser-specific getters (locStart, locEnd)

4. **Optimize Common Patterns**
   - Identify frequently occurring AST patterns
   - Create fast paths for simple cases
   - Avoid complex logic for simple nodes

### How to Measure Impact

Use the enhanced profiling to measure before/after:

```bash
# Before optimization
yarn debug test.js --debug-perf-profile --log-level=debug
# Note the "Main print" time

# After optimization
yarn debug test.js --debug-perf-profile --log-level=debug
# Compare the "Main print" time
```

Target: Reduce "Main print" time by 10-30% for significant overall speedup.

## Why Not Focus Elsewhere?

- **Comment handling** is already well-optimized (~5% of AST-to-Doc)
- **Parsing** is only ~20-30% of total time, limited optimization potential
- **Print Doc** is already fast (~7-15% of total time)
- **Preprocess** is negligible (<1% of AST-to-Doc)

Focusing on main print gives the highest return on optimization effort.

## References

See the updated documentation for more details:
- `PERFORMANCE_ANALYSIS.md` - Full analysis with test results
- `BOTTLENECK_ANALYSIS_GUIDE.md` - User guide with examples
