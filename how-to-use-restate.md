# restate

A minimal, framework-agnostic reactive state management library built on ES6 proxies. `restate` provides:

- A tiny footprint (~1.5 KB gzipped), zero dependencies.
- A simple core API: `$onChange`, `$watch`, `$set`, and `$destroy`.
- Chainable plugin system to add computed properties, persistence, history, immutability, async handling, and custom methods.
- Both CommonJS and ES module builds for universal compatibility.
- No boilerplate: read and write state directly on a proxy.

**Bundle size (minified + gzipped): ~1.5 KB (1,512 bytes).**

## Installation

Import directly in a browser or module bundler:

```js
import { restate } from './src/restate.js';
```

Alternatively, in CommonJS environments (e.g., Node.js without ESM support):

```js
const { restate } = require('restate');
```

This CJS entrypoint allows you to use `restate` via `require()` without transpilation or loader flags, ensuring compatibility with older Node.js versions and CommonJS-based tooling.

## Create a Reactive State

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
state.count = 5;        // Triggers change notifications
```

## Core Reactivity API

### $onChange(fn)

Subscribe to *all* key/value changes. The callback receives `(key, newValue, oldValue)`:

```js
state.$onChange((key, newValue, oldValue) => {
  console.log(`${key} changed from`, oldValue, 'to', newValue);
});
```

You can also omit oldValue if you’re only interested in the new value:

```js
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
Batch multiple updates into one notification:

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

### $destroy()
Disable further updates and clear watchers:

```js
state.$destroy();
state.count = 7; // Throws or no-op
```

### Native Methods

Below are the core methods available on every `restate` instance:

| Method                          | Parameters                                      | Returns        | Description                                                 |
|------------------------------|-----------------------------|-------------------------|
| `use(pluginFactory, options)`   | `pluginFactory` (function or plugin), `options?` (object) | reactive proxy   | Register a plugin after initialization        |
| `$onChange(fn)`                 | `fn(key, newValue, oldValue)` (function)        | reactive proxy   | Subscribe to all value changes with previous value          |
| `$watch(path, handler)`         | `path` (string), `handler` (function)           | `() => void`   | Watch a specific path or wildcard (`*`/`**`)                 |
| `$watch(path, handler)`         | `path` (string), `handler(key, newValue, oldValue)` (function) | `() => void`   | Watch changes on a path or wildcard with previous value      |
| `$unwatch(path)`                | `path` (string)                                 | reactive proxy   | Remove the watcher for the given path                       |
| `$set(updatesOrFn)`             | `updatesOrFn` (object or function)              | reactive proxy   | Apply atomic updates; accepts an object or updater function |
| `$destroy()`                    | none                                            | reactive proxy   | Destroy the reactive proxy: clear watchers and disable updates       |

```js
// Example: core methods
const state = restate({ a: 1 });
state.$onChange((k,v) => console.log(k, v));
const unwatch = state.$watch('a', (k,v) => console.log('watched', k, v));
state.$set({ a: 2 });
unwatch();
state.$destroy();
```

## Plugin System

Chain plugins on restate initialization or afterwards:

```js
import { restate }         from './src/restate.js';
import { PersistencePlugin } from './__src/js/raw-state/plugins/restate-persistence-plugin.js';
import { ImmutablePlugin }   from './__src/js/raw-state/plugins/restate-immutable-plugin.js';
import { MethodsPlugin }     from './__src/js/raw-state/plugins/restate-methods-plugin.js';

// Chainable registration:
const state = restate({ count: 0, items: [] })
  .use(PersistencePlugin, { key: 'appState', debounce: 300 })
  .use(ImmutablePlugin,   { strict: false })
  .use(MethodsPlugin);
```

## Plugin System Details & Building Custom Plugins

Plugins enable you to hook into state changes, add methods, and integrate custom behavior.

1 **Plugin Factory**

Call `state.use(pluginFactory, options)`. Under the hood it runs:

```js
const plugin = pluginFactory(options);
core.use(plugin);
```

2 **Plugin Object Shape**

- `name` (string): Unique plugin identifier used in directives or logs.
- `hooks?` (object): Lifecycle hooks you can implement:
  - `beforeSet(target, prop, value, path)`
  - `afterSet(target, prop, value, path)`
  - `beforeNotify(key, value)`
  - `afterNotify(key, value)`
  - `beforeBulk()`
  - `afterBulk()`
  - `onDestroy()`
- `methods?` (object): Custom methods to add to the reactive proxy
- `init?` (function): Runs once when the plugin is registered.

```js
  methods: {
    customAction() { /* this === reactive proxy */ }
  }
```

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

### Example: Methods Plugin

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
state2.reset(); // count is now 0
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

### PersistencePlugin

Auto-saves and restores state to storage.

Usage:

```js
state.use(PersistencePlugin, {
  persist: true,                  // enable auto-persist (default)
  persistKey: 'appState',         // storage key (default 'restate')
  persistStorage: 'localStorage', // or 'sessionStorage' or custom adapter
  persistDebounce: 300,           // ms debounce between saves
  persistInclude: null,           // array of paths to include
  persistExclude: null,           // array of paths to exclude
  persistEncrypt: false,          // enable encryption
  persistVersion: 1,              // version for migrations
  persistMigrations: {}           // object mapping version→migrationFn
});
```

| Option           | Type             | Default       |
|------------------|------------------|---------------|
| persist          | boolean          | true          |
| persistKey       | string           | 'restate'     |
| persistStorage   | string           | 'localStorage'|
| persistDebounce  | number           | 300           |
| persistInclude   | array or null    | null          |
| persistExclude   | array or null    | null          |
| persistEncrypt   | boolean          | false         |
| persistVersion   | number           | 1             |
| persistMigrations| object           | {}            |

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

| Option             | Type              | Default   |
|--------------------|-------------------|-----------|
| strict             | boolean           | true      |
| customErrorMessage | function or null | null      |

#### Non-Strict Mode

By setting `strict: false`, direct property mutations are allowed without throwing:

```js
import { ImmutablePlugin } from './src/plugins/restate-plugin-immutable.js';
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

#### Strict Mode

With `strict: true`, direct property mutations throw errors, but you can still apply updates using `$set`:

```js
import { ImmutablePlugin } from './src/plugins/restate-plugin-immutable.js';
const state = restate({ count: 0 })
  .use(ImmutablePlugin, { strict: true });

// Direct set throws
try { state.count = 1; } catch (e) { console.error(e.message); }

// update with $set works
state.$set({ count: 1 });
console.log(state.count); // 1
```

---

### MethodsPlugin

Allows defining custom mutation methods on the state.

Usage:

```js
state.use(MethodsPlugin);

// then call:
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

#### Interoperability with ImmutablePlugin

You can register custom mutation methods under strict immutability by using `$set` within your methods:

```js
import { ImmutablePlugin } from './src/plugins/restate-plugin-immutable.js';
import { MethodsPlugin } from './src/plugins/restate-plugin-methods.js';

const state = restate({ count: 0 })
  .use(ImmutablePlugin, { strict: true })
  .use(MethodsPlugin);

// Define methods that use $set internally
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

### ComputedPlugin

Adds reactive computed properties with dependency tracking.

Usage:

```js
state.use(ComputedPlugin());
state.$computed({
  sum: s => s.a + s.b,
  doubleSum: s => s.sum * 2  // can reference other computed props
});
```

Methods added to store:

- `$computed(obj)` → register computed functions
- `$dependencies()` → inspect which base keys each computed depends on

Dependencies are automatically tracked; when a base property changes, computed caches are invalidated and recomputed on access.

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

Hooks:

- `beforeSet`, `beforeBulk` → record history before mutation
- `onDestroy` → clear history

```js
import { restate } from './src/restate.js';
import { HistoryPlugin } from './src/plugins/restate-plugin-history.js';

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
state.use(AsyncPlugin);
```

Methods added to store:

- `$async(key, asyncFn, options)` → manage an async task
- `$clearCache(key?)` → clear cached async results
- `$isLoading(key)` → boolean loading state

`$async` options:

- `cache` (bool) & `cacheTime` (ms)
- `dedupe` (bool) for concurrent calls
- `retries`, `retryDelay`
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

#### AsyncPlugin Examples

## Basic loading & error handling

```js
// Basic loading and error state
await state.$async('data', fetchData, {
  loadingKey: 'loading',
  errorKey: 'error'
});
console.log(state.loading); // false
console.log(state.error);   // undefined
```

## Optimistic update

```js
// Provide an optimistic initial value
await state.$async('count', () => api.getCount(), {
  optimistic: 0,
  dataKey: 'count'
});
console.log(state.count); // 0 then actual value
```

## Retry logic

```js
// Retry on failure up to 3 times
await state.$async('fetchUser', () => fetchUser(), {
  retries: 3,
  retryDelay: 1000,
  dataKey: 'user',
  errorKey: 'userError'
});
```

## Dedupe concurrent calls

```js
// Dedupe concurrent invocations
const p1 = state.$async('todos', () => fetchTodos(), { dedupe: true });
const p2 = state.$async('todos', () => fetchTodosNew(), { dedupe: true });
console.log(p1 === p2); // true
```

## Manual cache clear

```js
// Manually clear cached data
state.$clearCache('todos');
```

## Loading state check

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
import { restate } from './src/restate.js';
import { ValidatePlugin } from './src/plugins/restate-plugin-validate.js';

const state = restate({ age: 0, name: '' })
  .use(ValidatePlugin({
    'age': v => Number.isInteger(v) && v >= 0
  }));
```

Methods:

| Method                     | Parameters                          | Returns        | Description                           |
|----------------------------|-------------------------------------|----------------|---------------------------------------|
| `$validators(newValidators)` | `object` mapping path→validator      | reactive proxy | Add or update validators at runtime   |

#### ValidatePlugin Examples

1 **Primitive validation**

```js
// initial setup
const state = restate({ age: 0 }).use(ValidatePlugin({
  'age': v => Number.isInteger(v) && v >= 0
}));

state.age = 10;  // valid
state.age = -5;  // throws TypeError
```

2 **Runtime validators**

```js
state.$validators({
  'name': v => typeof v === 'string' && v.trim().length > 0
});

state.name = 'Alice'; // valid
state.name = '';      // throws TypeError
```

3 **Nested property validation**

```js
const userState = restate({ user: { email: '' } })
  .use(ValidatePlugin({
    'user.email': v => /^[^@]+@[^@]+\.[^@]+$/.test(v)
  }));

userState.user.email = 'bob@example.com';  // valid
userState.user.email = 'invalid-email';    // throws TypeError
```

## Boolean validation

```js
const boolState = restate({ isAdmin: false })
  .use(ValidatePlugin({
    'isAdmin': v => typeof v === 'boolean'
  }));

boolState.isAdmin = true;  // valid
boolState.isAdmin = 'yes'; // throws TypeError
```

## Object validation

```js
const configState = restate({ config: {} })
  .use(ValidatePlugin({
    'config': v =>
      v && typeof v === 'object' && 'mode' in v && ['light','dark'].includes(v.mode)
  }));

configState.config = { mode: 'dark' }; // valid
configState.config = { version: 1 };   // throws TypeError
```

## Array validation

```js
const listState = restate({ items: [] })
  .use(ValidatePlugin({
    'items': arr => Array.isArray(arr) && arr.every(x => typeof x === 'number')
  }));

listState.items = [1,2,3];       // valid
listState.items = ['a','b','c']; // throws TypeError
```

---

## Examples

### Simple Persistence + Methods

```js
import { restate } from './src/restate.js';
import { PersistencePlugin } from './src/plugins/restate-plugin-persistence.js';
import { MethodsPlugin } from './src/plugins/restate-plugin-methods.js';

// Initialize with persistence and methods
const state = restate({ count: 0, items: [] })
  .use(PersistencePlugin, { persistKey: 'appState', persistDebounce: 0 })
  .use(MethodsPlugin);

// Define methods that use $set internally
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

### PersistencePlugin

Auto-saves and restores state to storage.

Usage:

```js
state.use(PersistencePlugin, {
  persist: true,                  // enable auto-persist (default)
  persistKey: 'appState',         // storage key (default 'restate')
  persistStorage: 'localStorage', // or 'sessionStorage' or custom adapter
  persistDebounce: 300,           // ms debounce between saves
  persistInclude: null,           // array of paths to include
  persistExclude: null,           // array of paths to exclude
  persistEncrypt: false,          // enable encryption
  persistVersion: 1,              // version for migrations
  persistMigrations: {}           // object mapping version→migrationFn
});
```

| Option           | Type             | Default       |
|------------------|------------------|---------------|
| persist          | boolean          | true          |
| persistKey       | string           | 'restate'     |
| persistStorage   | string           | 'localStorage'|
| persistDebounce  | number           | 300           |
| persistInclude   | array or null    | null          |
| persistExclude   | array or null    | null          |
| persistEncrypt   | boolean          | false         |
| persistVersion   | number           | 1             |
| persistMigrations| object           | {}            |

Methods of PersistencePlugin Plugin:

| Method                         | Parameters                                | Returns      | Description                          |
|--------------------------------|-------------------------------------------|--------------|--------------------------------------|
| `$save()`                      | None                                      | state proxy  | Manually save the state              |
| `$load()`                      | None                                      | state proxy  | Manually load persisted state        |
| `$clear()`                     | None                                      | state proxy  | Clear persisted data                 |
| `$exists()`                    | None                                      | boolean      | Check if persisted data exists       |
| `$setPersistenceOptions(opts)` | `opts` (object)                           | state proxy  | Update persistence options           |
| `$setEncryption(encFn, decFn)` | `encFn` (function), `decFn` (function)    | state proxy  | Register encryption/decryption funcs |

Hooks:

- `afterNotify` → triggers debounced save
- `onDestroy` → clears timers and pending saves

---

### ImmutablePlugin

Enforces immutability on direct property sets.

Usage:

```js
state.use(ImmutablePlugin, { strict: true });
```

| Option             | Type               | Default |
|--------------------|--------------------|---------|
| strict             | boolean            | true    |
| customErrorMessage | function &#124; null | null    |

Methods of ImmutablePlugin Plugin:

| Method                         | Parameters          | Returns     | Description                         |
|--------------------------------|---------------------|-------------|-------------------------------------|
| `$enableImmutable()`           | None                | state proxy | Turn strict immutability on         |
| `$disableImmutable()`          | None                | state proxy | Turn strict immutability off        |
| `$isImmutable()`               | None                | boolean     | Check if strict immutability is on  |
| `$setImmutableOptions(opts)`   | `opts` (object)     | state proxy | Update plugin error/custom settings |

---

### MethodsPlugin

Allows defining custom mutation methods on the state.

Usage:

```js
state.use(MethodsPlugin);
state.$methods({ increment(n) { this.count += n; }, reset() { this.count = 0; } });
```

Methods of MethodsPlugin Plugin:

| Method               | Parameters              | Returns     | Description                          |
|----------------------|-------------------------|-------------|--------------------------------------|
| `$methods(methodsObj)` | `methodsObj` (object) | state proxy | Define custom mutation methods       |

---

### ComputedPlugin

Adds reactive computed properties with dependency tracking.

Usage:

```js
state.use(ComputedPlugin());
state.$computed({ sum: s => s.a + s.b });
```

Methods of ComputedPlugin Plugin:

| Method               | Parameters         | Returns     | Description                         |
|----------------------|--------------------|-------------|-------------------------------------|
| `$computed(obj)`     | `obj` (object)     | state proxy | Register computed functions         |
| `$dependencies()`    | None               | object      | Retrieve computed dependencies      |

---

#### ComputedPlugin Examples

```js
import { restate } from './src/restate.js';
import { ComputedPlugin } from './src/plugins/restate-plugin-computed.js';

// Initialize state with values
const state = restate({ a: 1, b: 2 }).use(ComputedPlugin());

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

##### Additional ComputedPlugin Examples

###### Chaining computed values

```js
import { restate } from './src/restate.js';
import { ComputedPlugin } from './src/plugins/restate-plugin-computed.js';

const state = restate({ a: 2, b: 3 })
  .use(ComputedPlugin());

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

###### Inspecting dependency graph

```js
console.log(state.$dependencies());
// → {
//     sum: ['a','b'],
//     product: ['a','b'],
//     doubledSum: ['sum'],
//     sumPlusProd: ['sum','product']
//   }
```

###### Computed over nested objects

```js
const userState = restate({ user: { first: 'Jane', last: 'Doe' } })
  .use(ComputedPlugin());

userState.$computed({
  fullName: s => `${s.user.first} ${s.user.last}`,
  initials: s => `${s.user.first[0]}.${s.user.last[0]}.`
});

console.log(userState.fullName);  // → "Jane Doe"
console.log(userState.initials);  // → "J.D."

userState.user.last = 'Smith';
console.log(userState.fullName);  // → "Jane Smith"
```

**Reactive side-effects with `$onChange` + computed**

```js
const counter = restate({ count: 0 })
  .use(ComputedPlugin());

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

###### Dynamically adding more computed props

```js
state.$computed({
  triple: s => s.a * 3
});
console.log(state.triple);        // → 12 (if a === 4)
```

---

### HistoryPlugin

Tracks state changes and provides undo/redo functionality.

Usage:
```js
state.use(HistoryPlugin, { trackHistory: true, maxHistory: 50 });
```

| Option       | Type    | Default |
|--------------|---------|---------|
| trackHistory | boolean | true    |
| maxHistory   | number  | 50      |

Methods of HistoryPlugin Plugin:

| Method           | Parameters | Returns     | Description                         |
|------------------|------------|-------------|-------------------------------------|
| `$undo()`        | None       | state proxy | Revert to previous snapshot         |
| `$redo()`        | None       | state proxy | Advance to next snapshot            |
| `$canUndo()`     | None       | boolean     | Check availability of undo          |
| `$canRedo()`     | None       | boolean     | Check availability of redo          |
| `$getHistory()`  | None       | object      | Get history metadata and indices    |
| `$clearHistory()`| None       | state proxy | Clear history stack                 |

---

### AsyncPlugin

Provides async operations, loading/error state, caching, and retry logic.

Usage:

```js
state.use(AsyncPlugin);
```

Methods of AsyncPlugin Plugin:

| Method                         | Parameters                                        | Returns     | Description                                              |
|--------------------------------|---------------------------------------------------|-------------|----------------------------------------------------------|
| `$async(key, asyncFn, options)` | `key` (string), `asyncFn` (function), `options?` (object) | Promise     | Perform async operation with loading/error/caching logic |
| `$clearCache(key?)`            | `key?` (string)                                   | state proxy | Clear cached async results                              |
| `$isLoading(key)`              | `key` (string)                                    | boolean     | Check if async operation for key is in progress         |

---

## Comparison with Other State Management Libraries

| Library | Paradigm           | Immutability             | Key API                         | Extensibility    | Size (gzipped) | Scope             |
|---------|--------------------|--------------------------|---------------------------------|------------------|----------------|-------------------|
| **restate** | Proxy + plugins   | Optional strict immutable | `$set`, `$onChange`, `$watch`    | Plugin-based     | Core: ~1.5 KB; async: ~0.9 KB; computed: ~0.6 KB; history: ~0.7 KB; immutable: ~0.5 KB; methods: ~0.3 KB; persistence: ~1.4 KB | Framework-agnostic |
| Redux   | Flux / functional  | Immutable by design       | `createStore`, `dispatch`, `reducer` | Middleware       | ~2.5 KB        | Framework-agnostic |
| Vuex    | Flux for Vue      | Immutable via patterns    | `state`, `getters`, `mutations`, `actions` | Plugin-based     | ~12 KB         | Vue.js            |
| Zustand | Hooks             | Mutable                   | `setState`, `getState`, `subscribe`  | Middleware       | ~1.6 KB        | React             |
| MobX    | Observables       | Mutable                   | Decorators, `action`, `autorun`    | Plugin-based     | ~20 KB         | Framework-agnostic |
| XState  | State machines    | Immutable transitions     | `createMachine`, `interpret`       | Plugin-based     | ~8 KB          | Framework-agnostic |

All libraries have different trade-offs: restate provides fine-grained change tracking with an extensible plugin system, enabling a middle ground between full immutability and direct mutation with minimal boilerplate.

## License

Non-commercial and commercial license details:

- Non-commercial use only (no modifications, derivative works, distribution, etc): see [LICENSE-NONCOMMERCIAL.md](LICENSE-NONCOMMERCIAL.md)
- Commercial use (no modifications or derivatives): see [EULA-COMMERCIAL.md](EULA-COMMERCIAL.md)
