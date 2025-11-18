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
3. **Print Doc** - Converting document to formatted string

## Example Output

```
[debug] '--debug-perf-profile' measurements:
[debug]   Parse:        13.808ms
[debug]   AST to Doc:   47.592ms
[debug]   Print Doc:    8.647ms
[debug]   Total:        70.047ms
```

## Interpreting Results

### What the Numbers Mean

- **Parse time** includes reading the file and parsing it into an AST
- **AST to Doc time** includes traversing the AST and applying formatting rules
- **Print Doc time** includes converting the document back to a string

### Current Bottleneck

Based on extensive testing, **AST to Doc is the bottleneck**, taking 60-70% of total time.

### Why This Matters

Understanding where time is spent helps prioritize optimization efforts:

- ✅ Focus on optimizing AST-to-Doc conversion (biggest impact)
- ✅ Focus on printer implementations in `src/language-js/print/`
- ⚠️ Parser optimization has limited impact (only ~20-30% of time)
- ⚠️ Print Doc is already well optimized

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
5. Focus on reducing AST-to-Doc time

## See Also

- [PERFORMANCE_ANALYSIS.md](./PERFORMANCE_ANALYSIS.md) - Detailed analysis and recommendations
- [commands.md](./commands.md) - All available commands
