:: { style="width: 96px; height: auto;" }
![autoDefine logo](../__src/img/autoDefine-logo.svg)
::

# autoDefine

::div{style="display: inline-flex; gap: calc(var(--space-unit)*1);"}
![npm version](https://img.shields.io/npm/v/@nativelayer.dev/auto-define)
![bundle size](https://img.shields.io/bundlephobia/minzip/@nativelayer.dev/auto-define)
![license](https://img.shields.io/github/license/ynck-chrl/auto-define)
![last commit](https://img.shields.io/github/last-commit/ynck-chrl/auto-define)
::

A zero-dependency utility that scans the DOM for undefined custom elements and automatically imports and registers them. No manual `import` per component, no explicit `customElements.define()` list to maintain. Add a component to your HTML and it loads itself.

---

## Why autoDefine ?

As a project grows, maintaining a registry of `import` / `customElements.define` calls becomes tedious and error-prone. Every new component requires two places to update, and forgetting either leaves a silently broken element in the DOM.

`autoDefine` inverts the relationship: the HTML is the source of truth. It scans the DOM, discovers every hyphenated tag that isn't yet registered, derives the file path from the tag name, and imports it. If the module has a default export, it is registered automatically.

- **Zero configuration.** One call with no arguments works for most projects.
- **Three candidate paths.** Flat files, folder-per-component, and `index.js` conventions all work without extra options.
- **Four naming conventions.** `kebab`, `camel`, `pascal`, and `snake`. `caseConvention` accepts one name, a list, or `true` for all four.
- **Self-registering modules.** If a file calls `customElements.define` itself, that is respected; `autoDefine` does not double-register.
- **Dynamic observation.** Pass `observe: true` to watch for elements injected after the initial scan (SPA navigation, lazy-rendered sections).
- **Include and exclude.** Limit registration to your own tags, or skip third-party elements, with an exact name or a `prefix*`.
- **No build step.** Pure ES module. Drop it in and run.

---

## Installation

### Package managers

```bash
npm install @nativelayer.dev/auto-define
```

```bash
pnpm add @nativelayer.dev/auto-define
```

```bash
yarn add @nativelayer.dev/auto-define
```

Then import the function:

```js
import { autoDefine } from '@nativelayer.dev/auto-define'
```

### CDN

```html
<script type="module">
  import { autoDefine } from 'https://cdn.jsdelivr.net/npm/@nativelayer.dev/auto-define/index.js'
  await autoDefine()
</script>
```

---

## Usage

### Zero-config

With no arguments, `autoDefine` scans `document.body`, looks for files in `/components/`, and uses `kebab-case` filenames.

```html
<body>
  <site-header></site-header>
  <news-feed></news-feed>
  <site-footer></site-footer>
</body>

<script type="module">
  import { autoDefine } from '@nativelayer.dev/auto-define'
  const { resolved, failed } = await autoDefine()
  // imports /components/site-header.js → defines <site-header>
  // imports /components/news-feed.js   → defines <news-feed>
  // imports /components/site-footer.js → defines <site-footer>
</script>
```

### Custom path and naming convention

```js
const { resolved, failed } = await autoDefine({ path: '/elements/', caseConvention: 'pascal' })
// imports /elements/SiteHeader.js → defines <site-header>
// imports /elements/NewsFeed.js   → defines <news-feed>
```

---

## Path resolution

For each discovered tag name, `autoDefine` tries **three candidate paths** in order. The first successful import wins.

| # | Pattern | Example for `<my-widget>` (pascal) |
|---|---------|--------------------------------------|
| 1 | `{path}/{FileName}.js` | `/components/MyWidget.js` |
| 2 | `{path}/{tag-name}/{FileName}.js` | `/components/my-widget/MyWidget.js` |
| 3 | `{path}/{tag-name}/index.js` | `/components/my-widget/index.js` |

This means a flat file structure and a folder-per-component structure both work without any configuration change.

When `caseConvention` is `true` or an array, those three paths are repeated for each convention before the next one starts. The first module that self-registers or exports a constructor wins.

---

## Naming conventions

| Convention | Option value | `my-element` becomes |
|------------|-------------|----------------------|
| kebab-case | `'kebab'` (default) | `my-element` |
| camelCase  | `'camel'` | `myElement` |
| PascalCase | `'pascal'` | `MyElement` |
| snake_case | `'snake'` | `my_element` |

```js
// default: kebab — looks for /components/my-element.js
await autoDefine()

// camel — looks for /components/myElement.js
await autoDefine({ caseConvention: 'camel' })

// pascal — looks for /components/MyElement.js
await autoDefine({ caseConvention: 'pascal' })

// snake — looks for /components/my_element.js
await autoDefine({ caseConvention: 'snake' })
```

### Try several conventions

`caseConvention` accepts one name, `true`, or an array. Omitting it tries kebab only.

```js
// kebab, then camel, then pascal, then snake
await autoDefine({ caseConvention: true })

// only these, in this order — kebab is not added automatically
await autoDefine({ caseConvention: ['camel', 'pascal'] })
```

For `<my-element>` with `['kebab', 'camel']`, the attempts are:

1. `/components/my-element.js`
2. `/components/my-element/my-element.js`
3. `/components/my-element/index.js` (named export `my-element`)
4. `/components/myElement.js`
5. `/components/my-element/myElement.js`
6. `/components/my-element/index.js` (named export `myElement`)

`index.js` is the same URL each time. It is checked again because the expected named export changes. A default export resolves on the first successful load, and later conventions are not tried. Put the convention you use most first.

---

## Component file patterns

### Default export (recommended)

Export the class as default. `autoDefine` calls `customElements.define(tag, Ctor)` automatically.

```js
// /components/my-widget.js
export default class MyWidget extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<p>Hello</p>`
  }
}
```

No `customElements.define` call needed inside the file.

### Self-registering module

If the module calls `customElements.define` itself, `autoDefine` detects this and skips the automatic registration.

```js
// /components/my-widget.js
class MyWidget extends HTMLElement { /* ... */ }
customElements.define('my-widget', MyWidget) // self-registers
```

Both patterns are supported without any extra configuration.

### Named export matching the filename

If there is no default export, `autoDefine` looks for a named export that matches the converted filename.

```js
// /components/MyWidget.js  (pascal convention)
export class MyWidget extends HTMLElement { /* ... */ }
```

The export name must exactly match the converted filename (`MyWidget` for `<my-widget>` with `pascal`). A mismatch causes a silent skip (see edge cases).

---

## Examples

### Scoped scan

Scan only inside a specific subtree:

```js
await autoDefine({ root: '#app' })
// only elements inside #app are discovered
```

```js
const shell = document.querySelector('app-shell')
await autoDefine({ root: shell, path: '/app/components/' })
```

### Include and exclude tags

Limit which undefined custom elements are imported. Each entry is an exact tag name, or a prefix ending in `*`.

```js
await autoDefine({
  include: ['native-*'],
  exclude: ['native-icon'],
})
// <native-topbar> is imported
// <native-icon> is skipped
// <vercel-analytics> is skipped
```

```js
await autoDefine({
  include: ['native-topbar', 'native-menu', 'native-sidebar'],
})
```

A tag is registered only when it matches `include` (if set) and does not match `exclude` (if set). Patterns are case-insensitive. An empty `include` array registers nothing.

Skipped tags are not imported, do not warn, and do not appear in `failed`. With `debug: true` they are logged:

```
[autoDefine] skipped by include/exclude: ['native-icon', 'vercel-analytics']
```

`observe: true` uses the same filter for elements added later.

### Watch for dynamically added elements

Use `observe: true` to keep defining elements injected after the initial scan 

Useful in SPA routing or lazy-loaded sections. Always pair with a `signal` to avoid memory leaks.

```js
const controller = new AbortController()

await autoDefine({
  observe: true,
  signal: controller.signal,
})

// disconnect when the page or route unmounts
controller.abort()
```

### SPA route changes

Re-run or rely on the observer across route changes:

```js
let controller = new AbortController()

async function onRouteEnter() {
  controller = new AbortController()
  await autoDefine({
    root: '#app',
    observe: true,
    signal: controller.signal,
  })
}

function onRouteLeave() {
  controller.abort()
}
```

### Debug mode

Log every resolution attempt and result:

```js
await autoDefine({ debug: true })
// [autoDefine] discovered undefined custom elements: ['site-header', 'news-feed']
// [autoDefine] <site-header> trying /components/site-header.js
// [autoDefine] <site-header> defined from /components/site-header.js
// [autoDefine] <news-feed> trying /components/news-feed.js
// [autoDefine] <news-feed> trying /components/news-feed/news-feed.js
// [autoDefine] <news-feed> defined from /components/news-feed/index.js
```

Unresolved elements and export mismatches always produce a `console.warn` regardless of `debug`. Debug mode adds the per-candidate `trying` logs on top of that.

### Using the return value

`autoDefine` returns `{ resolved: string[], failed: string[] }` after the initial scan. Use it to react to failures, log diagnostics, or guard the next step:

```js
const { resolved, failed } = await autoDefine({ path: '/components/' })

if (failed.length) {
  console.warn('Components that could not be loaded:', failed)
}
```

Combined with `waitForElementsReady`, skip the reveal if critical components failed:

```js
const { failed } = await autoDefine({ path: '/components/' })

if (failed.includes('site-header') || failed.includes('data-table')) {
  document.body.innerHTML = `<p class="error">Failed to load required components.</p>`
} else {
  await waitForElementsReady(document.body)
}
```

### Combined with `waitForElementsReady`

`autoDefine` handles registration. `waitForElementsReady` handles readiness and page reveal. Run them in sequence:

```js
import { autoDefine }           from '@nativelayer.dev/auto-define'
import { waitForElementsReady } from '@nativelayer.dev/wait-for-elements-ready'

const { failed } = await autoDefine({ path: '/components/', debug: true })

if (failed.length) {
  console.warn('[app] components failed to load:', failed)
}

await waitForElementsReady(document.body, { timeout: 6000 })
```

```css
body       { visibility: hidden; }
body.ready { visibility: visible; }
```

### Absolute URL path

For cross-origin or CDN-hosted components, pass a full URL as `path`:

```js
await autoDefine({ path: 'https://cdn.example.com/components/' })
// imports https://cdn.example.com/components/my-widget.js
```

---

## Anti-patterns

### ❌ Using a relative path

```js
await autoDefine({ path: './components/' })
// may resolve inconsistently depending on the page's URL
```

`import()` resolves relative paths against the calling module's URL, not the page root. This can break when the page URL changes across routes.

### ✅ Always use root-relative paths

```js
await autoDefine({ path: '/components/' })
```

A leading `/` anchors the path to the origin, making it consistent everywhere.

---

### ❌ Using `observe: true` without `signal`

```js
await autoDefine({ observe: true })
// MutationObserver runs forever — never garbage collected
// [autoDefine] observe: true set without a signal — the MutationObserver will never disconnect...
```

`autoDefine` now warns when `observe: true` is set without a `signal`, but the observer still runs. The warning is a reminder, not a guard.

### ✅ Always pair `observe` with a `signal`

```js
const controller = new AbortController()
await autoDefine({ observe: true, signal: controller.signal })

// when done
controller.abort()
```

---

### ❌ Expecting an error when a component file is missing

```js
await autoDefine({ path: '/components/' })
// no error thrown — but a console.warn is always emitted:
// [autoDefine] <broken-widget> could not be resolved under /components/
```

`autoDefine` never throws for missing files. It always emits a `console.warn` when an element cannot be resolved, and the tag appears in the `failed` array of the return value.

### ✅ Check the return value to react to failures

```js
const { failed } = await autoDefine({ path: '/components/' })

if (failed.length) {
  console.error('Missing components:', failed)
  // handle gracefully — show fallback UI, skip reveal, etc.
}
```

---

### ❌ Named export that doesn't match the filename convention

```js
// /components/MyWidget.js (pascal convention)
export class Widget extends HTMLElement { /* ... */ }
//            ^^^^^^ — 'Widget', not 'MyWidget' — will not be found
```

`autoDefine` looks for `mod.default` first, then `mod[fileName]` where `fileName` is the converted tag name (e.g. `MyWidget`). A mismatch causes a silent skip.

### ✅ Match the export name to the filename or use default export

```js
export class MyWidget extends HTMLElement { /* ... */ }
// or
export default class extends HTMLElement { /* ... */ }
```

---

### ❌ Scanning an element before it is in the DOM

```js
const panel = document.createElement('app-panel')
await autoDefine() // <app-panel> is not in the DOM yet — not discovered
document.body.appendChild(panel)
```

`autoDefine` only scans what is currently in the DOM at the time of the call.

### ✅ Append first, then call (or use `observe: true`)

```js
document.body.appendChild(panel)
await autoDefine() // <app-panel> is now in the DOM — discovered
```

---

## Edge cases

### Root not found -> throws synchronously

If the `root` option is a selector string that matches nothing, `autoDefine` throws before any imports:

```js
try {
  await autoDefine({ root: '#does-not-exist' })
} catch (err) {
  console.error(err.message) // "[autoDefine] root element not found"
}
```

---

### No undefined custom elements -> resolves immediately

If every hyphenated element in the target is already defined (or there are none), `autoDefine` resolves immediately with no network activity:

```js
// <my-card> already registered
customElements.define('my-card', MyCard)

await autoDefine() // no imports, resolves instantly
```

---

### All candidates fail -> always warns

When a tag's file cannot be found at any candidate path, `autoDefine` emits a `console.warn` unconditionally and adds the tag to the `failed` array:

```
[autoDefine] <broken-widget> could not be resolved under /components/
```

```js
const { failed } = await autoDefine()
// failed: ['broken-widget']
```

No error is thrown. Use the `failed` array to detect and react to missing components.

---

### Module loads but has no usable export — always warns

If a module is found but has no `default` export and no named export matching the converted filename, `autoDefine` emits a specific `console.warn` and marks the tag as failed:

```js
// /components/my-widget.js
export const config = { version: '1.0' }
// no default, no 'MyWidget' — <my-widget> remains undefined
```

```bash
[autoDefine] <my-widget> file(s) found under /components/ but no usable export (expected default export or named export "MyWidget")
```

This message is distinct from the "could not be resolved" warning, making it clear the file was found but the export was wrong.

When `caseConvention` lists more than one convention, the warning lists every name that was expected:

```bash
[autoDefine] <my-element> file(s) found under /components/ but no usable export (expected default export or named exports "my-element", "myElement")
```

---

### Path with or without trailing slash

`autoDefine` normalizes the `path` option: a missing trailing slash is added automatically.

```js
await autoDefine({ path: '/components' })
// treated identically to { path: '/components/' }
```

---

### Unknown `caseConvention` — throws immediately

Passing an unrecognized convention throws synchronously before any scanning:

```js
await autoDefine({ caseConvention: 'upper' })
// throws: "[autoDefine] unknown case-convention: "upper""
```

The same error is thrown for an unknown name inside an array. These also throw before any scanning:

```js
await autoDefine({ caseConvention: [] })
// throws: "[autoDefine] caseConvention must list at least one naming convention, or be true"

await autoDefine({ caseConvention: ['kebab', 'kebab'] })
// throws: "[autoDefine] caseConvention lists "kebab" more than once"

await autoDefine({ caseConvention: false })
// throws: "[autoDefine] caseConvention must be a naming convention, true, or an array of naming conventions"
```

`caseConvention: ['camel']` tries camel only. It does not also try the default kebab.

---

### Invalid `include` / `exclude` pattern — throws immediately

Each entry must be an exact custom-element tag name, or a prefix that ends with a single `*`. These throw before any scanning:

```js
await autoDefine({ include: 'native-*' })
// throws: "[autoDefine] include must be an array of strings"

await autoDefine({ include: ['native'] })
// throws: "[autoDefine] include pattern "native" must be a custom element tag name"

await autoDefine({ exclude: ['*'] })
// throws: "[autoDefine] exclude pattern "*" is too broad — use a prefix such as "native-*""

await autoDefine({ include: ['*button'] })
// throws: "[autoDefine] include pattern "*button" must be an exact tag name or end with a single *"
```

### Tags outside `include` / `exclude` are ignored

A tag that fails the filter is left untouched. It is not imported, it does not produce a `console.warn`, and it is absent from both `resolved` and `failed`.

```js
await autoDefine({ include: ['native-*'] })
// <vercel-analytics> is ignored, even if no file exists for it
```

### Already-defined elements are skipped

Elements already registered via `customElements.define` (whether by a previous `autoDefine` call or manually) are excluded from the scan. They are never re-imported.

```js
customElements.define('my-card', MyCard) // already defined

await autoDefine()
// <my-card> is skipped — not re-imported
```

---

### Shadow DOM is not scanned

`autoDefine` uses `querySelectorAll('*')` which does not pierce shadow roots. Custom elements inside a shadow DOM are not discovered.

```js
class MyShell extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.innerHTML = `<data-chart></data-chart>`
    // <data-chart> is invisible to autoDefine
  }
}
```

To handle shadow DOM elements, either import them explicitly in the component file or call `autoDefine` with the shadow root as target after it is created.

---

### `observe: true` without `signal` — observer never disconnects

If `observe: true` is set and no `signal` is provided, the `MutationObserver` runs for the lifetime of the page with no way to clean it up. This is a memory leak in SPAs where the scanned subtree is destroyed and rebuilt on route changes.

---

## Options reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `root` | `HTMLElement \| string` | `document.body` | DOM scope to scan for undefined custom elements |
| `path` | `string` | `'/components/'` | Base path for component files. Root-relative or absolute URL. Trailing slash is added automatically if missing. |
| `caseConvention` | `convention \| true \| convention[]` | `'kebab'` | One filename convention, a list tried in order, or `true` for kebab, camel, pascal, then snake. A convention is `'kebab'`, `'camel'`, `'pascal'`, or `'snake'`. |
| `observe` | `boolean` | `false` | Watch for dynamically added custom elements after the initial scan |
| `signal` | `AbortSignal` | — | Disconnect the MutationObserver (requires `observe: true`). Strongly recommended — omitting it logs a warning and leaks the observer. |
| `debug` | `boolean` | `false` | Log resolution attempts and outcomes to the console |
| `include` | `string[]` | — | Only register tags matching one of these exact names or `prefix*` patterns. An empty array registers nothing. |
| `exclude` | `string[]` | — | Skip tags matching one of these exact names or `prefix*` patterns. Applied after `include`. |

---

## License

MIT License. Copyright (c) 2026 ynck-chrl.
