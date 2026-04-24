:: { style="width: 96px; height: auto;" }
![restate logo](../__src/img/restate-logo.svg)
::

# restate

version `0.2.1`

A minimal, framework-agnostic reactive state management library built on ES6 proxies. `restate` provides:

- A tiny footprint (~2.8 KB gzipped), zero dependencies.
- A simple core API: `$onChange`, `$watch`, `$set`, `$destroy`, plus built-in `$computed` and `$methods`.
- Chainable plugin system to add persistence, history, immutability, async handling, and validation.
- Both CommonJS and ES module builds for universal compatibility.
- No boilerplate: read and write state directly on a proxy.

**Bundle size (minified + gzipped): ~2.8 KB** — includes built-in `$computed()` and `$methods()`.

## Installation

Published on npm as [**`@nativelayer.dev/restate`**](https://www.npmjs.com/package/@nativelayer.dev/restate).

### Package managers

```bash
npm install @nativelayer.dev/restate
yarn add @nativelayer.dev/restate
bun add @nativelayer.dev/restate
```

After installing, import from the package name:

```js
// ESM (recommended)
import { restate } from '@nativelayer.dev/restate';

// CommonJS (Node.js)
const { restate } = require('@nativelayer.dev/restate');
```

### CDN (browser, Deno, or plain ESM without a bundler)

Prefer a **pinned** version in production (replace `0.2.1` with the release you ship).
To always follow **latest**, use the “latest” URL for each CDN (builds can change without warning):

```js
// esm.sh — pinned
import { restate } from 'https://esm.sh/@nativelayer.dev/restate@0.2.1';
// esm.sh — latest (no version suffix)
import { restate } from 'https://esm.sh/@nativelayer.dev/restate';

// unpkg — pinned
import { restate } from 'https://unpkg.com/@nativelayer.dev/restate@0.2.1/dist/restate.esm.min.js';
// unpkg — latest
import { restate } from 'https://unpkg.com/@nativelayer.dev/restate@latest/dist/restate.esm.min.js';

// Skypack — pinned
import { restate } from 'https://cdn.skypack.dev/@nativelayer.dev/restate@0.2.1';
// Skypack — latest (omit the version)
import { restate } from 'https://cdn.skypack.dev/@nativelayer.dev/restate';
```

### Vendored `dist` files (clone / download)

If you ship the library files next to your app:

```js
// ESM (recommended)
import { restate } from './dist/restate.esm.min.js';

// CommonJS (Node.js)
const { restate } = require('./dist/restate.cjs.min.js');
```

### Which format should I use?

| Your setup | Use this |
|------------|----------|
| npm, Yarn, or Bun project | `@nativelayer.dev/restate` after install |
| Vite, esbuild, modern bundler | Package import or `dist/restate.esm.min.js` (vendored) |
| Node.js with `require()` | Package `require` or `dist/restate.cjs.min.js` |
| Node.js with `"type": "module"` | Package import or `dist/restate.esm.min.js` |
| No install (CDN) | esm.sh, unpkg, or Skypack URLs above |

## Basic Usage

Basic operations can be done with a straight-forward syntax:

### Create a Reactive State

Initialize with a plain object:

```js
const state = restate({
  count: 0,
  items: []
});
```

### Access and Mutation

Read and write properties directly on the reactive proxy:

```js
console.log(state.count); // 0
// Straight forward syntax for mutations
state.count = 5; // mutates 'count'  
// and triggers change notifications
```

## Core Reactivity API

### $onChange(fn)

Subscribe to *all* key/value changes. The callback receives `(key, newValue, oldValue)`:

```js
state.$onChange((key, newValue, oldValue) => {
  console.log(`${key} changed from`, oldValue, 'to', newValue);
});

// You can also omit oldValue if you’re only interested in the new value:
state.$onChange((key, newValue) => {
  console.log(`${key} changed to`, newValue);
});
```

### $watch(path, handler)

Listen to specific key or wildcard patterns (`\*` or `\**`). The handler receives `(key, newValue, oldValue)`:

```js
// Exact key
state.$watch('count', (key, newValue, oldValue) => console.log(`count changed from ${oldValue} to ${newValue}`));
// You can omit oldValue if desired:
state.$watch('count', (key, newValue) => console.log(`count is now ${newValue}`));

// Single-level wildcard: watches direct children of 'user'
state.$watch('user.*', (key, newValue, oldValue) => console.log(key, newValue, oldValue));

// Deep wildcard: watches all nested descendants of 'config'
state.$watch('config.**', (key, newValue, oldValue) => console.log(key, newValue, oldValue));
```

Returns an *unwatch* function to cancel:

```js
const unwatch = state.$watch('count', handler);
unwatch();
```

### $set(updatesOrFn)

Batch multiple updates into one operation :

```js
// Object form
state.$set({ count: 10, foo: 'bar' });

// Function form
state.$set(s => {
  s.count++;
  s.items.push('x');
});

// Nested object update
state.$set({
  user: { name: 'Alice', roles: ['admin', 'editor'] },
  loggedIn: true
});
console.log(state.user); // { name: 'Alice', roles: ['admin','editor'] }
console.log(state.loggedIn); // true

// Complex updates with function form
state.$set(s => {
  // toggle a boolean flag
  s.loggedIn = !s.loggedIn;
  // increment count by 5 only if logged in
  if (s.loggedIn) {
    s.count += 5;
  }
});
console.log(state.count, state.loggedIn);
```

### $methods(obj)

Define custom methods on the state proxy. Methods are **non-enumerable** and have `this` bound to the proxy:

```js
state.$methods({
  increment() { this.count++; },
  reset() { this.count = 0; }
});

state.increment(); // count = 1
state.reset();     // count = 0
```

> Why use `$methods()` instead of direct assignment?

```js
// ❌ Direct assignment - problematic
state.getUserById = function(id) { return this.users.find(u => u.id === id); };
```

| Issue | Direct Assignment | `$methods()` |
|-------|-------------------|--------------|
| **Triggers watchers** | ✅ Yes (unwanted) | ❌ No |
| **Enumerable** | ✅ Yes (pollutes `Object.keys()`) | ❌ No |
| **`this` binding** | ⚠️ Can be lost | ✅ Always bound |
| **Shows in `JSON.stringify`** | ⚠️ Attempted | ❌ No |

**Use `$methods()` to cleanly separate behavior from data.**

Usage:

```js
// $methods() is available without any plugin
state.$methods({
  increment(n) { this.count += n; },
  reset() { this.count = 0; }
});
```

Custom methods are added to the reactive proxy (non-enumerable) and can be called directly:

```js
state.increment(5);
state.reset();
```

### $destroy()

Disable further updates and clear watchers:

```js
state.$destroy();
state.count = 7; // Throws or no-op
```

### $computed(obj)

Define reactive computed properties with automatic dependency tracking:

```js
import { restate } from './dist/restate.esm.min.js';

// Initialize state - $computed is built-in, no plugin needed
const state = restate({ a: 1, b: 2 });

// Define computed properties
state.$computed({
  sum: s => {
    console.log('computing sum');
    return s.a + s.b;
  },
  double: s => s.sum * 2
});

// First access triggers computation
console.log(state.sum);   // logs 'computing sum', outputs 3
console.log(state.double); // outputs 6 (sum is cached)

// Second access uses cache
console.log(state.sum);   // no log, outputs 3

// Changing a base value invalidates cache
state.a = 5;              // invalidates sum
console.log(state.sum);   // logs 'computing sum', outputs 7
console.log(state.double); // logs no 'computing sum' but recomputes double: outputs 14
```

Chaining computed values:

```js
import { restate } from './dist/restate.esm.min.js';

// No plugin needed - $computed is built-in
const state = restate({ a: 2, b: 3 });

state.$computed({
  sum:          s => s.a + s.b,
  product:      s => s.a * s.b,
  doubledSum:   s => s.sum * 2,
  sumPlusProd:  s => s.sum + s.product
});

console.log(state.sum);           // → 5
console.log(state.product);       // → 6
console.log(state.doubledSum);    // → 10
console.log(state.sumPlusProd);   // → 11

state.a = 4;                      // invalidates `sum` & `product`
console.log(state.doubledSum);    // → 14
```

Computed over nested objects:

```js
const userState = restate({ user: { first: 'Jane', last: 'Doe' } });

userState.$computed({
  fullName: s => `${s.user.first} ${s.user.last}`,
  initials: s => `${s.user.first[0]}.${s.user.last[0]}.`
});

console.log(userState.fullName);  // → "Jane Doe"
console.log(userState.initials);  // → "J.D."

userState.user.last = 'Smith';
console.log(userState.fullName);  // → "Jane Smith"
```

Reactive side-effects with `$onChange` + computed

```js
const counter = restate({ count: 0 });

counter.$computed({
  parity: s => s.count % 2 === 0 ? 'even' : 'odd'
});

counter.$onChange((key, newVal) => {
  if (key === 'count') {
    console.log(`Count is ${newVal}, parity: ${counter.parity}`);
  }
});

counter.count = 1;  // logs "Count is 1, parity: odd"
```

Dynamically adding more computed props:

```js
state.$computed({
  triple: s => s.a * 3
});
console.log(state.triple);        // → 12 (if a === 4)
```

### $dependencies()

Inspect dependency graph to know which properties each computed depends on (useful for debugging):

```js
console.log(state.$dependencies());
// → {
//     sum: ['a','b'],
//     product: ['a','b'],
//     doubledSum: ['sum'],
//     sumPlusProd: ['sum','product']
//   }
```

Dependencies are automatically tracked; when a base property changes, computed caches are invalidated and recomputed on access.

### All methods table

Below are the core methods available on every `restate` instance:

| Method                          | Parameters                                      | Returns        | Description                                                 |
|---------------------------------|-------------------------------------------------|----------------|-------------------------------------------------------------|
| `use(pluginFactory, options)`   | `pluginFactory` (function or plugin), `options?` (object) | reactive proxy   | Register a plugin after initialization                     |
| `$onChange(fn)`                 | `fn(key, newValue, oldValue)` (function)        | reactive proxy   | Subscribe to all value changes with previous value          |
| `$watch(path, handler)`         | `path` (string), `handler` (function)           | `() => void`   | Watch a specific path or wildcard (`\*`/`\**`)                 |
| `$watch(path, handler)`         | `path` (string), `handler(key, newValue, oldValue)` (function) | `() => void`   | Watch changes on a path or wildcard with previous value      |
| `$unwatch(path)`                | `path` (string)                                 | reactive proxy   | Remove the watcher for the given path                       |
| `$set(updatesOrFn)`             | `updatesOrFn` (object or function)              | reactive proxy   | Apply atomic updates; accepts an object or updater function |
| `$computed(obj)`                | `obj` (object of getter functions)              | reactive proxy   | Define computed properties with auto dependency tracking    |
| `$dependencies()`               | none                                            | object         | Get dependency graph for all computed properties            |
| `$methods(obj)`                 | `obj` (object of functions)                     | reactive proxy   | Define custom methods (non-enumerable, bound to proxy)      |
| `$destroy()`                    | none                                            | reactive proxy   | Destroy the reactive proxy: clear watchers and disable updates       |

All native methods combined:

```js
// Example: core methods
const state = restate({ a: 1, b: 2, count: 0 });

// Change tracking
state.$onChange((k,v) => console.log(k, v));
const unwatch = state.$watch('a', (k,v) => console.log('watched', k, v));

// Computed properties (built-in)
state.$computed({
  sum: s => s.a + s.b
});
console.log(state.sum); // 3

// Custom methods (built-in)
state.$methods({
  increment() { this.count++; }
});
state.increment(); // count = 1

// Batch updates
state.$set({ a: 2 });

// Cleanup
unwatch();
state.$destroy();
```

## Plugin System

`retate` is designed with a plugin architecture to keep the core library minimal and focused, while providing extensibility for advanced use cases. Rather than bundling every possible feature into the main library (which would bloat the bundle size), restate exposes a plugin API that allows you to add only the functionality you need.

This design philosophy ensures that:

- **The core stays lightweight** (~2.8 KB) with zero dependencies
- **You only pay for what you use** — plugins are optional and can be loaded on demand
- **Custom behavior is possible** — you can build plugins tailored to your specific needs
- **The API remains simple** — core methods stay consistent regardless of which plugins are active

Plugins hook into `restate`'s lifecycle events (like `beforeSet`, `afterSet`, `beforeNotify`), enabling you to hook into state changes, add methods and integrate custom behaviors that allow to implement features like persistence, immutability, validation, history tracking, and more.

Chain optional plugins for additional features:

```js
import { restate }           from './dist/restate.esm.min.js';
import { PersistencePlugin } from './dist/plugin/persistence.esm.min.js';
import { ImmutablePlugin }   from './dist/plugin/immutable.esm.min.js';

// Chainable registration:
const state = restate({ count: 0, items: [] })
  .use(PersistencePlugin, { key: 'appState', debounce: 300 })
  .use(ImmutablePlugin,   { strict: false });
```

### Plugin Factory

To use a plugin call `state.use(pluginFactory, options)`. Under the hood it runs the `pluginFactory(option)` function:

```js
const plugin = pluginFactory(options);
core.use(plugin);
```

### Plugin Object Shape

- `name` (string): Unique plugin identifier used in directives or logs.
- `hooks?` (object): Lifecycle hooks you can implement:
  - `beforeSet(target, prop, value, path)`
  - `afterSet(target, prop, value, path)`
  - `beforeNotify(key, value)`
  - `afterNotify(key, value)`
  - `beforeBulk()`
  - `afterBulk()`
  - `onDestroy()`
- `methods?` (object): Custom methods to add to the reactive proxy:

```js
methods: {
  customAction() { /* this === reactive proxy */ }
}
```

- `install?` (function): Runs once when the plugin is registered.

### Example: Logging Plugin

```js
function LogPlugin({ prefix = '' } = {}) {
  return {
    name: 'log',
    hooks: {
      afterNotify(key, value) {
        console.log(`${prefix}${key} =>`, value);
      }
    }
  };
}

const state = restate({ count: 0 })
  .use(LogPlugin, { prefix: '[LOG] ' });
state.count = 1; // logs "[LOG] count => 1"
```

### Example: Reset Plugin

```js
function ResetPlugin() {
  return {
    name: 'reset',
    methods: {
      reset() { this.count = 0; }
    }
  };
}

const state2 = restate({ count: 42 })
  .use(ResetPlugin);
state2.reset();
console.log(state.count) // count is now 0
```

You can freely mix built-in and custom plugins:

```js
const state3 = restate({ count: 5 })
  .use(PersistencePlugin, { key: 'c3' })
  .use(LogPlugin)
  .use(ResetPlugin);
```

---

## Built-in Plugins

> **Note:** Built-in Plugins are audited and approuved by NativeWebDev team before being published. Always check and audit the code of Plugins you use with `restate` if they are not built-in plugins.

### PersistencePlugin

Auto-saves and restores state to storage.

Usage:

```js
state.use(PersistencePlugin, {
  persist: true,                    // enable auto-persist (default)
  persistKey: 'appState',           // storage key (default 'restate')
  persistStorage: 'localStorage',   // or 'sessionStorage' or custom adapter
  persistDebounce: 300,             // ms debounce between saves
  persistInclude: null,             // array of paths to include
  persistExclude: null,             // array of paths to exclude
  persistEncrypt: false,            // password string for AES-256-GCM encryption
  persistIntegrity: false,          // enable HMAC-SHA256 integrity checking
  persistVersion: 1,                // version for migrations
  persistMigrations: {},            // object mapping version→migrationFn
  persistValidateSchema: null       // (state) => boolean, validates before migrations
});
```

| Option               | Type                  | Default       | Description |
|----------------------|-----------------------|---------------|-------------|
| persist              | boolean               | true          | Enable auto-persist |
| persistKey           | string                | 'restate'     | Storage key name |
| persistStorage       | string \| object      | 'localStorage' | Storage adapter |
| persistDebounce      | number                | 300            | ms between saves |
| persistInclude       | array \| null         | null           | Paths to include |
| persistExclude       | array \| null         | null           | Paths to exclude |
| persistEncrypt       | boolean \| string     | false          | Password for AES-256-GCM |
| persistIntegrity     | boolean \| string     | false          | Enable HMAC verification |
| persistVersion       | number                | 1              | Schema version |
| persistMigrations    | object                | {}             | Version→migration map |
| persistValidateSchema| function \| null      | null           | Schema validator |

Hooks:

- `afterNotify` → triggers debounced save
- `onDestroy` → clears timers and pending saves

---

### ImmutablePlugin

Enforces immutability on direct property sets (optional bulk updates).

Usage:

```js
state.use(ImmutablePlugin, {
  strict: true   // throw on direct sets (default)
});
```

| Plugin Option             | Type              | Default   |
|--------------------|-------------------|-----------|
| strict             | boolean           | true      |
| customErrorMessage | function \| null | null      |

#### Non-Strict Mode

By setting `strict: false`, direct property mutations are allowed without throwing:

```js
import { ImmutablePlugin } from './dist/plugin/immutable.esm.min.js';
const state = restate({ count: 0, user: { name: 'Alice' } })
  .use(ImmutablePlugin, { strict: false });

state.count = 1;        // works without error
state.user.name = 'Bob'; // works without error
```

You can also toggle strict mode at runtime using the plugin methods:

```js
state.$enableImmutable();   // turn strict mode on
state.count = 2;            // throws error

state.$disableImmutable();  // turn strict mode off
state.count = 3;            // works without error
```

| ImmutablePlugin Method             | Type      | Default   |
|--------------------|-------------------|-----------|
| $enableImmutable        | boolean  | true      |
| $disableImmutable$ | function \| null | null      |

#### Strict Mode

With `strict: true`, direct property mutations throw errors, but you can still apply updates using `$set`:

```js
import { ImmutablePlugin } from './dist/plugin/immutable.esm.min.js';
const state = restate({ count: 0 })
  .use(ImmutablePlugin, { strict: true });

// Direct set throws
try { state.count = 1; } catch (e) { console.error(e.message); }

// update with $set works
state.$set({ count: 1 });
console.log(state.count); // 1
```

#### Interoperability with `$methods()`

You can register custom mutation methods under strict immutability by using `$set` within your methods:

```js
import { restate } from './dist/restate.esm.min.js';
import { ImmutablePlugin } from './dist/plugin/immutable.esm.min.js';

const state = restate({ count: 0 })
  .use(ImmutablePlugin, { strict: true });

// $methods is built-in - define methods that use $set internally
state.$methods({
  inc() {
    this.$set({ count: this.count + 1 });
  },
  reset() {
    this.$set({ count: 0 });
  }
});

state.inc();   // count = 1
state.reset(); // count = 0
```

---

### HistoryPlugin

Tracks state changes and provides undo/redo functionality.

Usage:

```js
state.use(HistoryPlugin, {
  trackHistory: true, // default
  maxHistory: 50      // max snapshots to keep
});
```

| Option       | Type    | Default |
|--------------|---------|---------|
| trackHistory | boolean | true    |
| maxHistory   | number  | 50      |

Methods of HistoryPlugin:

| Method           | Parameters | Returns     | Description                         |
|------------------|------------|-------------|-------------------------------------|
| `$undo()`        | None       | state proxy | Revert to previous snapshot         |
| `$redo()`        | None       | state proxy | Advance to next snapshot            |
| `$canUndo()`     | None       | boolean     | Check availability of undo          |
| `$canRedo()`     | None       | boolean     | Check availability of redo          |
| `$getHistory()`  | None       | object      | Get history metadata and indices    |
| `$clearHistory()`| None       | state proxy | Clear history stack                 |

Hooks:

- `beforeSet`, `beforeBulk` → record history before mutation
- `onDestroy` → clear history

```js
import { restate } from './dist/restate.esm.min.js';
import { HistoryPlugin } from './dist/plugin/history.esm.min.js';

// Initialize state with history tracking
const state = restate({ count: 0 })
  .use(HistoryPlugin, { trackHistory: true, maxHistory: 10 });

// Make some changes
state.count = 1;
state.count = 2;
state.count = 3;

// Inspect history
console.log(state.$getHistory());
// { history: [...], currentIndex: 2, canUndo: true, canRedo: false }

// Undo and redo
state.$undo();
console.log(state.count); // 2
state.$undo();
console.log(state.count); // 1
state.$redo();
console.log(state.count); // 2

// Check availability
console.log(state.$canUndo()); // true
console.log(state.$canRedo()); // true

// Clear history if needed
state.$clearHistory();
console.log(state.$canUndo()); // false
```

```js
// Undo all changes
while(state.$canUndo()) { state.$undo(); }
console.log(state.count); // back to initial value

// Redo all changes
while(state.$canRedo()) { state.$redo(); }
console.log(state.count); // back to latest value

// Branching: new changes clear redo stack
state.count = 5;
state.$undo();
state.count = 20;        // new branch
console.log(state.$canRedo()); // false

// Peek history details without mutating
const { history, currentIndex } = state.$getHistory();
console.log(`Step ${currentIndex+1} of ${history.length}`, history);
```

---

### AsyncPlugin

Provides async operations, loading/error state, caching, and retry logic.

Usage:

```js
// Basic usage (with safe defaults)
state.use(AsyncPlugin());

// With custom limits
state.use(AsyncPlugin({
  maxRetries: 5,           // Cap on retries (default: 10)
  defaultTimeout: 10000,   // 10s timeout (default: 30s)
  maxCacheSize: 50,        // Max cache entries (default: 100)
  exponentialBackoff: true // Exponential backoff for retries (default: true)
}));

// Per-request options
await state.$async('data', fetchData, {
  timeout: 5000,  // 5s for this request (overrides default)
  retries: 3,     // Retries for this request (capped by maxRetries)
  cache: true,
  cacheTime: 60000
});
```

Methods added to store:

- `$async(key, asyncFn, options)` → manage an async task
- `$clearCache(key?)` → clear cached async results
- `$isLoading(key)` → boolean loading state

`$async` options:

- `timeout` (ms) — request timeout (default: 30s)
- `cache` (bool) & `cacheTime` (ms)
- `dedupe` (bool) for concurrent calls
- `retries`, `retryDelay` — retry attempts (capped by plugin's `maxRetries`)
- `optimistic` initial value
- `loadingKey`, `errorKey`, `dataKey` strings

Example:

```js
await state.$async('todos', () => fetchTodos(), {
  cache: true,
  cacheTime: 600000,
  loadingKey: 'todosLoading',
  errorKey: 'todosError'
});
```

**Basic loading & error handling**

```js
// Basic loading and error state
await state.$async('data', fetchData, {
  loadingKey: 'loading',
  errorKey: 'error'
});
console.log(state.loading); // false
console.log(state.error);   // undefined
```

**Optimistic update**

```js
// Provide an optimistic initial value
await state.$async('count', () => api.getCount(), {
  optimistic: 0,
  dataKey: 'count'
});
console.log(state.count); // 0 then actual value
```

**Retry logic**

```js
// Retry on failure up to 3 times
await state.$async('fetchUser', () => fetchUser(), {
  retries: 3,
  retryDelay: 1000,
  dataKey: 'user',
  errorKey: 'userError'
});
```

**Dedupe concurrent calls**

```js
// Dedupe concurrent invocations
const p1 = state.$async('todos', () => fetchTodos(), { dedupe: true });
const p2 = state.$async('todos', () => fetchTodosNew(), { dedupe: true });
console.log(p1 === p2); // true
```

**Manual cache clear**

```js
// Manually clear cached data
state.$clearCache('todos');
```

**Loading state check**

```js
// Check if async task is in progress
if (state.$isLoading('todos')) {
  console.log('Todos are still loading...');
}
```

---

### ValidatePlugin

Validate types or values on state updates using custom validator functions.

Usage:

```js
import { restate } from './dist/restate.esm.min.js';
import { ValidatePlugin } from './dist/plugin/validate.esm.min.js';

const state = restate({ age: 0, name: '' })
  .use(ValidatePlugin({
    'age': v => Number.isInteger(v) && v >= 0
  }));
```

Methods:

| Method                     | Parameters                          | Returns        | Description                           |
|----------------------------|-------------------------------------|----------------|---------------------------------------|
| `$validators(newValidators)` | `object` mapping path→validator      | reactive proxy | Add or update validators at runtime   |

**Primitive validation**

```js
// initial setup
const state = restate({ age: 0 }).use(ValidatePlugin({
  'age': v => Number.isInteger(v) && v >= 0
}));

state.age = 10;  // valid
state.age = -5;  // throws TypeError
```

**Runtime validators**

```js
state.$validators({
  'name': v => typeof v === 'string' && v.trim().length > 0
});

state.name = 'Alice'; // valid
state.name = '';      // throws TypeError
```

**Nested property validation**

```js
const userState = restate({ user: { email: '' } })
  .use(ValidatePlugin({
    'user.email': v => /^[^@]+@[^@]+\.[^@]+$/.test(v)
  }));

userState.user.email = 'bob@example.com';  // valid
userState.user.email = 'invalid-email';    // throws TypeError
```

**Boolean validation**

```js
const boolState = restate({ isAdmin: false })
  .use(ValidatePlugin({
    'isAdmin': v => typeof v === 'boolean'
  }));

boolState.isAdmin = true;  // valid
boolState.isAdmin = 'yes'; // throws TypeError
```

**Object validation**

```js
const configState = restate({ config: {} })
  .use(ValidatePlugin({
    'config': v =>
      v && typeof v === 'object' && 'mode' in v && ['light','dark'].includes(v.mode)
  }));

configState.config = { mode: 'dark' }; // valid
configState.config = { version: 1 };   // throws TypeError
```

**Array validation**

```js
const listState = restate({ items: [] })
  .use(ValidatePlugin({
    'items': arr => Array.isArray(arr) && arr.every(x => typeof x === 'number')
  }));

listState.items = [1,2,3];       // valid
listState.items = ['a','b','c']; // throws TypeError
```


## Snippets

### Simple Persistence + Methods

```js
import { restate } from './dist/restate.esm.min.js';
import { PersistencePlugin } from './dist/plugin/persistence.esm.min.js';

// Initialize with persistence ($methods is built-in, no plugin needed)
const state = restate({ count: 0, items: [] })
  .use(PersistencePlugin, { persistKey: 'appState', persistDebounce: 0 });

// Define methods that use $set internally (built-in)
state.$methods({
  addItem(item) {
    this.$set({ items: [...this.items, item] });
  },
  increment() {
    this.$set({ count: this.count + 1 });
  }
});

// Use methods
state.increment();
state.addItem('apple');

console.log(state.count); // 1
console.log(state.items); // ['apple']

// On new session or reload, restore persisted state
const restored = restate({}).use(PersistencePlugin, { persistKey: 'appState', persistDebounce: 0 });
console.log(restored.count); // 1
console.log(restored.items); // ['apple']
```

---

## Security Analysis

### $computed (Built-in)

| Concern | Status | Description |
|---------|--------|-------------|
| Reserved key pollution | ✅ Fixed | Skips `__proto__`, `constructor`, `prototype` |
| Circular dependencies | ✅ Fixed | Detects and prevents infinite loops |
| Non-function values | ✅ Fixed | Validates that computed values are functions |
| Memory cleanup | ✅ OK | `$destroy()` clears all computed state |

**Protections implemented:**

```javascript
// Reserved keys are skipped with warning
state.$computed({
  __proto__: () => 'blocked',    // ⚠️ Skipped
  constructor: () => 'blocked',  // ⚠️ Skipped
  validKey: (s) => s.a + s.b     // ✅ Allowed
});

// Circular dependencies detected
state.$computed({
  a: (s) => s.b,
  b: (s) => s.a  // ❌ Error: Circular dependency detected
});

// Non-functions rejected
state.$computed({
  notAFunction: 'string'  // ⚠️ Skipped with warning
});
```

---

### AsyncPlugin

| Concern | Status | Description |
| ------ | ---------- | ------------- |
| No timeouts | ✅ Fixed | Default 30s timeout, configurable per-request |
| Uncapped cache | ✅ Fixed | LRU eviction with `maxCacheSize` (default: 100) |
| Retry amplification | ✅ Fixed | Configurable `maxRetries` cap (default: 10) + exponential backoff |

**Plugin-level configuration:**

```javascript
state.use(AsyncPlugin({
  maxRetries: 10,           // Cap on retries (prevents DoS)
  defaultTimeout: 30000,    // 30s default timeout
  maxCacheSize: 100,        // Max cache entries (LRU eviction)
  exponentialBackoff: true  // 1s, 2s, 4s, 8s... between retries
}));
```

### HistoryPlugin

| Concern | Status | Description |
| ------ | ---------- | ------------- |
| JSON.stringify comparison | ✅ Fixed | Replaced with `deepEqual()` function |
| Circular reference handling | ✅ Fixed | `deepClone()` and `deepEqual()` use WeakMap/WeakSet |

**Good:** Max history limit enforced, cleanup on destroy, circular refs supported.

### ImmutablePlugin

| Concern | Status | Description |
|------|----------|-------------|
| Double proxy wrapping | ✅ Fixed | Now uses `beforeSet` hook, no extra proxy |
| `_wrap` override conflicts | ✅ Fixed | No longer overrides `_wrap` |

**Good:** Uses hook system, proper strict mode, clear error messages, no conflicts with other plugins.

### PersistencePlugin

| Risk | Severity | Status | Description |
|------|----------|--------|-------------|
| Plain text storage | Medium | ✅ Fixed | Sensitive data exposed in localStorage |
| No integrity check | Low | ✅ Fixed | Stored data could be tampered |
| Migration code execution | Low | ✅ Fixed | Custom migrations run user code |

**Fixes implemented:**

**1. Built-in AES-GCM encryption** — No more plain text storage:

```javascript
// Simple: just provide a password
const state = restate({ secrets: {} })
  .use(PersistencePlugin({
    persistKey: 'myApp',
    persistEncrypt: 'my-secret-password'  // AES-256-GCM encryption
  }));
```

**2. HMAC-SHA256 integrity checking** — Detect tampering:

```javascript
const state = restate({ data: {} })
  .use(PersistencePlugin({
    persistKey: 'myApp',
    persistEncrypt: 'password',     // Encryption
    persistIntegrity: true          // + HMAC verification
  }));
// If localStorage is modified, loadState() returns false
```

**3. Schema validation before migrations** — Validate before executing user code:

```javascript
const state = restate({ user: { id: '', name: '' } })
  .use(PersistencePlugin({
    persistKey: 'myApp',
    persistVersion: 2,
    persistMigrations: {
      2: (state) => ({ ...state, user: { ...state.user, email: '' } })
    },
    persistValidateSchema: (state) => {
      // Runs BEFORE migrations — reject malformed data
      return state && typeof state.user === 'object' && typeof state.user.id === 'string';
    }
  }));
```

**Good:** Encryption hooks available, debounced saves, path filtering, Web Crypto API (PBKDF2 key derivation).

### ValidatePlugin

| Risk | Severity | Status | Description |
|------|----------|--------|-------------|
| Value in error message | Low | ✅ Fixed | `JSON.stringify(value)` could expose secrets |
| Nested proxy overhead | Low | ✅ Fixed | Old implementation wrapped proxies with more proxies |

**1. Values are now safely redacted** in error messages to prevent sensitive data exposure:

**2. Now uses `beforeSet` hook** instead of monkey-patching `_wrap()` and creating nested proxies:

```javascript
// Old approach (problematic):
// - Overrode core._wrap() method
// - Wrapped core._proxy with another proxy in install()
// - Double proxy overhead on every access

// New approach (clean):
return {
  name: 'validation',
  hooks: {
    beforeSet(path, value, oldValue) {
      validateValue(path, value);  // Throws TypeError if invalid
    }
  },
  methods: { $validators(v) { /* ... */ } }
};
```

Error messages now safely redact sensitive values:

```javascript
// Before (exposed full value):
// "Validation failed for 'user.password': invalid value "secretPassword123""

// After (redacted):
// "Validation failed for 'user.password': received [string, 16 chars]"
// "Validation failed for 'config': received [object, 5 keys]"
// "Validation failed for 'items': received [array, 10 items]"
```

---

## Security Best Practices

> If you discover a security vulnerability, please report it privately to the maintainers rather than opening a public issue.

### What is already protected

The core automatically blocks prototype pollution in these operations:

- `$set()` / `$set({ key: value })` — skips `__proto__`, `constructor`, `prototype`
- `$computed()` — skips reserved keys
- Direct property assignment — goes through Proxy (safe)

**You don't need to sanitize data for normal state operations:**

```javascript
// ✅ Safe - restate handles this internally
state.$set({ user: apiResponse.user });
state.config = userInput;
```

- ✅ No `eval()` or `Function()` constructor usage
- ✅ No `innerHTML` or DOM manipulation
- ✅ No network requests in core (AsyncPlugin is opt-in)
- ✅ No file system access
- ✅ No child process spawning

---

### When to sanitize

Sanitize at your application's **trust boundary** — where untrusted data enters your system:

```javascript
// Helper function (copy this if needed)
const sanitize = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (['__proto__', 'constructor', 'prototype'].includes(k)) continue;
    clean[k] = typeof v === 'object' ? sanitize(v) : v; // Recursive for nested
  }
  return clean;
};

// ❌ DANGEROUS: Spreading untrusted data directly into objects
const merged = { ...state.user, ...untrustedInput }; // Bypasses Proxy!

// ✅ SAFE: Sanitize before spreading
const merged = { ...state.user, ...sanitize(untrustedInput) };

// ❌ DANGEROUS: Object.assign with untrusted data
Object.assign(someObject, untrustedInput);

// ✅ SAFE: Sanitize first
Object.assign(someObject, sanitize(untrustedInput));
```

---

### What operation to avoid

The following table lists all JavaScript operations that can bypass restate's Proxy traps:

| Operation | Bypasses Proxy? | Risk Level | Description | Safe Alternative |
|-----------|-----------------|------------|-------------|------------------|
| `{ ...obj }` (spread) | ✅ Yes | High | Creates plain object copy, no proxy traps | Use `state.$set()` or sanitize input |
| `Object.assign(target, src)` | ✅ Yes | High | Copies properties directly to target | Sanitize source before assigning |
| `JSON.parse(JSON.stringify(obj))` | ✅ Yes | High | Deep clone creates plain object | Use for serialization only, not mutation |
| `structuredClone(obj)` | ✅ Yes | High | Deep clone bypasses proxy entirely | Use for cloning only, not mutation |
| `Object.fromEntries(Object.entries(obj))` | ✅ Yes | Medium | Converts to/from entries, loses proxy | Avoid for state manipulation |
| `_.cloneDeep(obj)` (Lodash) | ✅ Yes | High | Library clones create plain objects | Use native proxy-aware methods |
| `Array.from(arr)` / `[...arr]` | ✅ Yes | Medium | Array spread creates plain array | Use `state.$set()` for array updates |
| `.map()`, `.filter()`, `.slice()` | ⚠️ Partial | Low | Returns new plain array (reads are proxied) | Assign result back via `$set()` |
| `Object.keys()` / `.values()` / `.entries()` | ❌ No | Low | Reads through proxy (safe for reading) | Safe to use |
| `for...in` / `for...of` | ❌ No | Low | Iteration triggers proxy traps | Safe to use |
| Destructuring `const { a } = state` | ⚠️ Partial | Low | Read is proxied, but `a` is now a plain value | Safe for reading, not for nested mutation |
| `Object.getOwnPropertyDescriptor()` | ⚠️ Partial | Low | Can access descriptors directly | Avoid for untrusted keys |
| `Reflect.get()` / `Reflect.set()` | ❌ No | Low | Works with proxy traps | Safe to use |
| `delete obj.prop` | ❌ No | Low | Triggers proxy `deleteProperty` trap | Safe to use |
| `'prop' in obj` | ❌ No | Low | Triggers proxy `has` trap | Safe to use |

**Legend:**
- ✅ Yes = Completely bypasses proxy, creates unprotected data
- ⚠️ Partial = Some operations are proxied, but result may not be
- ❌ No = Works correctly with proxy traps

```javascript
// Examples of bypassing operations

// 1. Spread operator - creates plain object
const copy = { ...state.user };        // copy is NOT a proxy
copy.__proto__ = malicious;            // ❌ No protection!

// 2. JSON round-trip - full bypass
const clone = JSON.parse(JSON.stringify(state));
clone.polluted = untrustedData;        // ❌ No protection!

// 3. structuredClone - full bypass
const deep = structuredClone(state);
deep.__proto__ = malicious;            // ❌ No protection!

// 4. Array methods return plain arrays
const filtered = state.items.filter(x => x.active);
filtered.push(untrustedItem);          // ❌ No proxy protection
state.$set({ items: filtered });       // ✅ Safe: goes through proxy

// 5. Destructuring extracts plain values
const { user } = state;                // user is now plain object if nested
user.name = 'hacked';                  // ⚠️ May not trigger watchers

// ✅ SAFE: Always use $set() for mutations
state.$set({ user: { ...state.user, name: 'Alice' } });
state.$set(s => { s.items.push(newItem); });
```

**Key insight:** The danger is when you use JavaScript operations (`...spread`, `Object.assign`, `JSON.parse`, `structuredClone`, etc.) that bypass restate's Proxy protection. If all data flows through `state.$set()` or direct property assignment on the proxy, you're protected.

---

### Encryption for persisted data

Choose your encryption key strategy based on your security needs:

```javascript
// 🟡 OBFUSCATION ONLY - Hardcoded key (visible in source code)
// Use for: UI preferences, non-sensitive settings
state.use(PersistencePlugin({
  persistEncrypt: 'app-obfuscation-key',
  persistIntegrity: true
}));
// ⚠️ Anyone viewing your bundle can extract this key

// 🟢 REAL SECURITY - User-derived key (recommended for sensitive data)
// Use for: Auth tokens, personal data, sensitive information
const userPassword = await promptUserForPassword();
state.use(PersistencePlugin({
  persistEncrypt: userPassword,  // Key derived via PBKDF2
  persistIntegrity: true
}));
// ✅ Only the user knows the key - truly encrypted

// 🟢 SESSION KEY - Server-provided (good with auth infrastructure)
const { sessionKey } = await authenticatedFetch('/api/session-key');
state.use(PersistencePlugin({
  persistEncrypt: sessionKey,
  persistIntegrity: true
}));
// ✅ Key not in source code, but requires backend support
```

| Key Strategy | Security Level | Best For |
|--------------|----------------|----------|
| Hardcoded / env var | 🟡 Obfuscation | UI state, preferences |
| User-derived (password) | 🟢 Real encryption | Sensitive user data |
| Server session key | 🟢 Good | Apps with auth backend |

---

### Validate all external inputs

```javascript
state.use(ValidatePlugin({
  'user.email': v => /^[^@]+@[^@]+\.[^@]+$/.test(v),
  'user.age': v => Number.isInteger(v) && v >= 0 && v <= 150
}));
```

---

### Limit watcher scope

```javascript
state.$watch('user.profile.*', fn);  // ✅ Specific paths
// Avoid: state.$watch('**', fn);    // ❌ Too broad, performance impact
```

---

### Set reasonable depth limits

```javascript
const state = restate(data, { maxDepth: 10 });
```

## Libraries Comparison

| Library | Paradigm | Computed | Immutability | Key API | Size (gzipped) | Scope |
|---------|----------|----------|--------------|---------|----------------|-------|
| **restate** | Proxy + plugins | ✅ Built-in | Optional strict | `$set`, `$onChange`, `$watch`, `$computed`, `$methods` | ~2.8 KB core | Framework-agnostic |
| Redux | Flux / functional | ❌ Needs reselect | Immutable by design | `createStore`, `dispatch`, `reducer` | ~2.5 KB + reselect ~0.6 KB | Framework-agnostic |
| Vuex | Flux for Vue | ✅ Getters | Immutable via patterns | `state`, `getters`, `mutations`, `actions` | ~12 KB | Vue.js |
| Zustand | Hooks | ⚠️ Manual | Mutable | `setState`, `getState`, `subscribe` | ~1.6 KB | React |
| MobX | Observables | ✅ @computed | Mutable | Decorators, `action`, `autorun` | ~20 KB | Framework-agnostic |
| XState | State machines | ❌ Derived only | Immutable transitions | `createMachine`, `interpret` | ~8 KB | Framework-agnostic |

All libraries have different trade-offs: `restate` provides fine-grained change tracking with built-in computed properties and custom methods, plus an extensible plugin system for additional features. It enables a middle ground between full immutability and direct mutation with minimal boilerplate.

## License

`restate` is licensed under the **[PolyForm Noncommercial License 1.0.0](./LICENSE)**.

- ✅ Free for personal, educational, research, and non-commercial use
- ✅ Non-profit organizations and public institutions
- ❌ Commercial use requires a separate license

See [LICENSE](./LICENSE) for full terms: https://polyformproject.org/licenses/noncommercial/1.0.0

**For commercial licensing:** info@nativelayer.dev
