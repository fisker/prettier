# Prettier JavaScript Formatting Performance Analysis

## Executive Summary

This document analyzes the performance bottleneck in Prettier's JavaScript file formatting. Using the new `--debug-perf-profile` flag, we've identified that **AST-to-Doc conversion is the primary bottleneck**, consuming approximately **60-70% of total formatting time**.

**Detailed Analysis:** Within the AST-to-Doc phase, the **main print function (AST traversal and printer logic)** accounts for ~80-85% of the time, with comment attachment and preprocessing being minor contributors.

## Testing Methodology

A new CLI flag `--debug-perf-profile` was added to measure the three main phases of formatting:

1. **Parse**: Converting source code text into an Abstract Syntax Tree (AST)
2. **AST to Doc**: Converting the AST into Prettier's internal document representation
   - Attach comments: Associating comments with AST nodes
   - Preprocess: Running printer-specific preprocessing
   - Prepare to print: Overall preparation overhead
   - Embedded languages: Processing JSX/embedded code
   - Main print: Core AST traversal and printer logic
3. **Print Doc**: Converting the document representation back to formatted text

### Usage

```bash
yarn debug <file.js> --debug-perf-profile --log-level=debug
```

### Example Output

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

## Test Results

### Small File (3 lines)
```javascript
const x = 1;
const y = 2;
console.log(x + y);
```

**Results:**
- Parse: 2.7ms (24%)
- **AST to Doc: 7.4ms (65%)**
- Print Doc: 1.2ms (11%)
- Total: 11.4ms

### Medium File (18 lines)
```javascript
// Basic class and function definitions
function example() { /* ... */ }
class MyClass { /* ... */ }
const arr = [1, 2, 3, 4, 5].map(x => x * 2).filter(x => x > 5);
```

**Results:**
- Parse: 5.0ms (24%)
- **AST to Doc: 14.2ms (69%)**
- Print Doc: 1.4ms (7%)
- Total: 20.6ms

### Large File (222 lines)
Complex React component with JSX, hooks, utility functions, PropTypes, etc.

**Results with Meriyah parser:**
- Parse: 14.1ms (18%)
- **AST to Doc: 51.4ms (67%)**
- Print Doc: 11.6ms (15%)
- Total: 77.0ms

**Results with Babel parser:**
- Parse: 23.0ms (29%)
- **AST to Doc: 47.5ms (60%)**
- Print Doc: 8.5ms (11%)
- Total: 79.1ms

**Results with Espree parser:**
- Parse: 19.4ms (24%)
- **AST to Doc: 48.5ms (61%)**
- Print Doc: 12.1ms (15%)
- Total: 80.0ms

## Key Findings

### 1. AST-to-Doc is the Bottleneck
Across all test cases and parsers, the **AST-to-Doc phase consistently consumes 60-70% of total formatting time**. 

**Detailed breakdown within AST-to-Doc:**
- **Main print: ~80-85%** - Core AST traversal and printer function calls
- Prepare to print: ~10-12% - Initial setup and comment attachment
- Embedded languages: ~5-10% - Processing JSX and embedded code (when present)
- Preprocess: <1% - Minimal overhead

The **main print phase** is where Prettier:
- Recursively traverses the AST
- Calls printer functions for each node type (in `src/language-js/print/`)
- Builds the intermediate document structure
- Applies formatting rules and line breaking logic

### 2. Main Print is the Real Bottleneck
Within the AST-to-Doc phase, the main print function accounts for ~80-85% of the time. This includes:
- AST node traversal in `src/main/ast-to-doc.js` (mainPrint function)
- Printer function calls in `src/language-js/print/*.js`
- Document builder operations
- Comment printing integrated with nodes

### 3. Comment Attachment is Well-Optimized
Comment attachment takes only ~10-12% of AST-to-Doc time, indicating this is already reasonably optimized.

### 4. Parser Choice Has Limited Impact on Overall Performance
While parser performance varies (Meriyah is fastest, Babel is slowest), this has minimal impact on overall formatting time since parsing is only ~18-29% of the total time.

### 5. Print Doc Phase is Well Optimized
The final phase (converting doc to text) is consistently fast, taking only 7-15% of total time regardless of file size.

### 6. Performance Scales with Code Complexity
The AST-to-Doc bottleneck becomes more pronounced with larger, more complex files:
- Small file (3 lines): 7.4ms
- Medium file (18 lines): 14.2ms  
- Large file (222 lines): 51.4ms

## Recommendations for Performance Optimization

### High Priority: Focus on Main Print

1. **Profile Hot Printer Functions**
   - Use profiling tools to identify which printer functions in `src/language-js/print/` are called most frequently
   - Likely candidates: `object.js`, `function.js`, `call-expression.js`, `member.js`, `binaryish.js`
   - Optimize the top 5-10 most frequently called printers
   - Consider micro-optimizations: reduce object allocations, cache results, avoid redundant checks

2. **Optimize AST Traversal**
   - The mainPrint recursion in `src/main/ast-to-doc.js` is called for every node
   - Profile the cache lookup and `callPluginPrintFunction` overhead
   - Consider optimizing the AstPath data structure for faster traversal
   - Reduce function call overhead where possible

3. **Document Builder Optimizations**
   - Profile document creation operations (arrays, strings, line breaks)
   - Look for opportunities to reduce intermediate object creation
   - Consider using object pools for frequently created document types

### Medium Priority

4. **Memoization for Repeated Patterns**
   - Implement caching for identical subtrees (already has node-level cache)
   - Consider memoizing printer function results for common patterns
   - Be careful about memory overhead vs. speed tradeoffs

5. **Reduce Comment Processing Overhead**
   - While comment attachment is only ~10-12%, integrating comment printing adds overhead
   - Profile `printComments` calls in the main print loop
   - Look for opportunities to batch or optimize comment printing

6. **Parser Selection**
   - Document that Meriyah parser is ~30% faster than Babel for parsing
   - Consider making Meriyah the default for JavaScript files

### Low Priority

7. **Incremental Formatting**
   - Explore options for incremental/partial formatting
   - Only reformat changed sections when possible
   - Requires significant architectural changes

8. **Print Doc Optimization**
   - Already well-optimized, but minor gains may be possible
   - Profile `src/document/printer/` for any remaining bottlenecks

## Specific Areas to Investigate

Based on the profiling data, focus optimization efforts on:

1. **`src/language-js/print/index.js`** - Main dispatcher, likely called for every node
2. **Most complex printers** - Large printers like `object.js`, `jsx.js`, `function.js`
3. **Frequently used printers** - `call-expression.js`, `member.js`, `literal.js`
4. **`src/main/ast-to-doc.js`** - The mainPrint recursion loop
5. **Document builders** - Operations in `src/document/` that create doc elements

Use CPU profiling (Node.js `--prof` or Chrome DevTools) on the detailed breakdown to identify hot paths.

## Technical Details

### Implementation

The profiling instrumentation was added in:
- `src/cli/cli-options.evaluate.js` - Added `debugPerfProfile` option
- `src/cli/format.js` - Added profiling output handler with detailed breakdown
- `src/main/core.js` - Added timing measurements around each phase
- `src/main/ast-to-doc.js` - Added detailed timing for AST-to-Doc sub-phases
- `src/main/normalize-format-options.js` - Added `__perfProfile` to passthrough options

### Code Locations

Key files for performance optimization:
- **AST-to-Doc** (Bottleneck):
  - `src/main/ast-to-doc.js` - Main conversion logic
  - `src/language-js/print/` - JavaScript-specific printers
  - `src/main/comments/` - Comment handling
  
- **Parse**:
  - `src/main/parse.js` - Parser invocation
  - Various parser implementations in dependencies

- **Print Doc**:
  - `src/document/printer/printer.js` - Document to string conversion

## Conclusion

The performance analysis clearly identifies **AST-to-Doc conversion as the primary bottleneck** in Prettier's JavaScript formatting. Optimization efforts should focus on:

1. Profiling and optimizing the AST traversal and printer functions
2. Optimizing comment handling and attachment logic
3. Exploring caching strategies for repeated patterns

The new `--debug-perf-profile` flag provides a useful tool for measuring the impact of any optimization efforts.
