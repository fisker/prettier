# Prettier JavaScript Formatting Performance Analysis

## Executive Summary

This document analyzes the performance bottleneck in Prettier's JavaScript file formatting. Using the new `--debug-perf-profile` flag, we've identified that **AST-to-Doc conversion is the primary bottleneck**, consuming approximately **60-70% of total formatting time**.

## Testing Methodology

A new CLI flag `--debug-perf-profile` was added to measure the three main phases of formatting:

1. **Parse**: Converting source code text into an Abstract Syntax Tree (AST)
2. **AST to Doc**: Converting the AST into Prettier's internal document representation
3. **Print Doc**: Converting the document representation back to formatted text

### Usage

```bash
yarn debug <file.js> --debug-perf-profile --log-level=debug
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
Across all test cases and parsers, the **AST-to-Doc phase consistently consumes 60-70% of total formatting time**. This is where Prettier:
- Traverses the AST
- Applies formatting rules
- Builds the intermediate document structure
- Handles comments, whitespace, and line breaking logic

### 2. Parser Choice Has Limited Impact on Overall Performance
While parser performance varies (Meriyah is fastest, Babel is slowest), this has minimal impact on overall formatting time since parsing is only ~18-29% of the total time.

### 3. Print Doc Phase is Well Optimized
The final phase (converting doc to text) is consistently fast, taking only 7-15% of total time regardless of file size.

### 4. Performance Scales with Code Complexity
The AST-to-Doc bottleneck becomes more pronounced with larger, more complex files:
- Small file (3 lines): 7.4ms
- Medium file (18 lines): 14.2ms  
- Large file (222 lines): 51.4ms

## Recommendations for Performance Optimization

### High Priority
1. **Optimize AST-to-Doc Conversion**
   - Profile and optimize hot paths in `src/main/ast-to-doc.js`
   - Profile and optimize printer implementations in `src/language-js/print/`
   - Consider caching or memoization for repeated subtree patterns
   - Investigate opportunities for parallel processing of independent subtrees

2. **Optimize Comment Handling**
   - Comments are processed during AST-to-Doc conversion
   - Look for opportunities to optimize comment attachment and placement logic

3. **Profile Printer Functions**
   - The JavaScript printer in `src/language-js/print/` is invoked during AST-to-Doc
   - Identify frequently called printer functions and optimize them

### Medium Priority
4. **Parser Selection**
   - Document that Meriyah parser is ~30% faster than Babel for parsing
   - Consider making Meriyah the default for JavaScript files

5. **Incremental Formatting**
   - Explore options for incremental/partial formatting
   - Only reformat changed sections when possible

### Low Priority
6. **Print Doc Optimization**
   - Already well-optimized, but minor gains may be possible
   - Profile `src/document/printer/` for any remaining bottlenecks

## Technical Details

### Implementation

The profiling instrumentation was added in:
- `src/cli/cli-options.evaluate.js` - Added `debugPerfProfile` option
- `src/cli/format.js` - Added profiling output handler
- `src/main/core.js` - Added timing measurements around each phase
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
