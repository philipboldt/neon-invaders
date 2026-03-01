---
name: pure-javascript
description: Pure JavaScript development focusing on modern ES2020+ standards, asynchronous logic, and clean code patterns. Use when writing, refactoring, or optimizing JavaScript (ESM) files for web or Node.js without specific framework requirements (like React or Angular).
---

# Pure JavaScript Skill

Modern JS patterns for ES2020+ with async code, safe property access, and modular syntax.

## Critical Patterns

### ✅ REQUIRED: ES Module Imports
Always use `import`/`export`. Ensure `package.json` has `"type": "module"` or use `.mjs` extension.
```javascript
// CORRECT: Named imports (explicit, tree-shakeable)
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

// CORRECT: Default import for modules with single export
import express from "express";

// WRONG: require() in ES modules
const fs = require("fs");
```

### ✅ REQUIRED: No Dead Code
Remove all unused variables, imports, and functions.
```javascript
// WRONG: Unused variables and imports
import { something } from "./lib"; // never used
const unused = 42;

// CORRECT: Every import, variable, and function is used
import { needed } from "./lib";
const count = needed();
```

### ✅ REQUIRED: const/let, Never var
Use `const` by default, `let` only if the value changes.
```javascript
// CORRECT
const API_URL = "https://api.example.com";
let count = 0;

// WRONG: var (function-scoped, hoisting issues)
var count = 0;
```

### ✅ REQUIRED: async/await for Async Operations
Avoid promise chains (`.then()`). Use `try/catch` for error handling.
```javascript
// CORRECT
async function fetchData() {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}
```

### ✅ REQUIRED: Optional Chaining and Nullish Coalescing
Safe access to nested properties and clear default values.
```javascript
// CORRECT: safe access + nullish coalescing
const name = user?.profile?.name ?? "Anonymous";
const port = config.port ?? 3000; // 0 won't fallback

// WRONG: || treats 0, '', false as falsy
const port = config.port || 3000; // 0 fallbacks to 3000!
```

### ✅ REQUIRED: Explicit Boolean Coercion
Make intent clear when checking for truthiness.
```javascript
// CORRECT
const hasData = !!data;
const isValid = Boolean(value);

// WRONG: implicit coercion hides intent
if (data) { /* unclear: existence or truthiness? */ }
```

### ✅ REQUIRED: Promise.all for Parallel Operations
Execute independent async tasks concurrently.
```javascript
// CORRECT: parallel
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
]);
```

## Decision Tree

- **Importing a module?** -> Named imports: `import { x } from "mod"`. No `require()`.
- **Unused import/variable?** -> Delete it. No dead code.
- **Async operation?** -> `async/await` with `try/catch`.
- **String concatenation?** -> Template literals: ``Hello ${name}``.
- **Default value?** -> `??` for null/undefined; `||` for any falsy if appropriate.
- **Property might not exist?** -> Optional chaining: `obj?.prop?.nested`.
- **Iterate array?** -> `.map()`, `.filter()`, `.reduce()`. Use `for...of` for early breaks.
- **Copy object/array?** -> Spread: `{...obj}`, `[...arr]`.
- **Callback?** -> Arrow function unless `this` context is needed.
- **Multiple independent awaits?** -> `Promise.all()` for parallel execution.

## Checklist

- [ ] ES module imports (`import`/`export`), no `require()`
- [ ] No unused imports, variables, or functions
- [ ] `const`/`let` only (no `var`)
- [ ] `async/await` with `try/catch` for async code
- [ ] `?.` and `??` for safe access and defaults
- [ ] `Promise.all()` for independent parallel fetches
- [ ] `===` for all equality checks
- [ ] Template literals for string interpolation
- [ ] Destructuring for objects and arrays
- [ ] Arrow functions for callbacks
- [ ] Modern array methods (`.map`, `.filter`, `.reduce`)

## Resources
- [MDN Web Docs - JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [ECMAScript Specification](https://tc39.es/ecma262/)
