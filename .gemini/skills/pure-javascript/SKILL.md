---
name: pure-javascript
description: Pure JavaScript development focusing on modern ES2020+ standards, asynchronous logic, and clean code patterns. Use when writing, refactoring, or optimizing JavaScript (ESM) files for web or Node.js without specific framework requirements (like React or Angular).
---

# Pure JavaScript Skill

Modern JS patterns for ES2020+ with async code, safe property access, and modular syntax.

## Critical Patterns

### ✅ REQUIRED: Zero-Build Architecture (Native ESM)
Always use native ES modules (`import`/`export`) that run directly in the browser without a build step (No Webpack, Rollup, or Vite).
- **Explicit Extensions:** Always include the `.js` extension in import paths (required by browsers).
- **Direct Loading:** Source files are loaded via `<script type="module">` in `index.html`.
- **No Bundling:** Never introduce a compilation or bundling step. The source code is the distribution.

```javascript
// CORRECT: Native ESM with explicit extension
import { Game } from "./Game.js";
import { Player } from "./Player.js";

// WRONG: Missing extension (works in Node/Bundlers, fails in Browser)
import { Game } from "./Game";

// WRONG: CommonJS (fails in Browser)
const Game = require("./Game.js");
```

### ✅ REQUIRED: No Dead Code
Remove all unused variables, imports, and functions.
```javascript
// WRONG: Unused variables and imports
import { something } from "./lib.js"; // never used
const unused = 42;

// CORRECT: Every import, variable, and function is used
import { needed } from "./lib.js";
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

- **Importing a module?** -> Native ESM: `import { x } from "./mod.js"`. Always include `.js`.
- **Architecture?** -> Zero-build. No `npm run build`. Source = Game.
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

- [ ] Native ESM imports (`import`/`export`) with `.js` extension
- [ ] Zero-build architecture (no bundling or compilation)
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
