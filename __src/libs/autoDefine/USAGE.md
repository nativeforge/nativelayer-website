# autoDefine — Usage

Scans the DOM for undefined custom elements and automatically imports and registers them via `customElements.define()`.

---

## Zero-config

Scans `document.body`, looks for files in `/components/`, expects **PascalCase** filenames.

```html
<body>
  <my-header></my-header>
  <my-dashboard></my-dashboard>
  <data-table></data-table>
</body>

<script type="module">
  import { autoDefine } from './src/autoDefine/index.js'

  await autoDefine()
  // imports: /components/MyHeader.js
  // imports: /components/MyDashboard.js
  // imports: /components/DataTable.js
</script>
```

---

## Path resolution

For each discovered tag, **three candidates are tried in order** — first match wins:

| # | Pattern | Example for `my-element` |
|---|---|---|
| 1 | `{path}/{FileName}.js` | `/components/MyElement.js` |
| 2 | `{path}/{tag-name}/{FileName}.js` | `/components/my-element/MyElement.js` |
| 3 | `{path}/{tag-name}/index.js` | `/components/my-element/index.js` |

This means both flat and folder-per-component structures work without configuration.

---

## Custom path

```js
await autoDefine({ path: '/elements/' })
// looks in /elements/ instead of /components/
```

Paths should be root-relative (starting with `/`) or absolute URLs.

---

## Naming conventions

Control how tag names are transformed into file and class names.

| Convention | Option | `my-element` → |
|---|---|---|
| PascalCase | `'pascal'` (default) | `MyElement` |
| camelCase | `'camel'` | `myElement` |
| kebab-case | `'kebab'` | `my-element` |
| snake_case | `'snake'` | `my_element` |

```js
// kebab filenames: /components/my-element.js
await autoDefine({ naming: 'kebab' })

// snake filenames: /components/my_element.js
await autoDefine({ naming: 'snake' })
```

---

## Self-registering components

If a module calls `customElements.define()` itself on import, `autoDefine` respects that and skips the automatic registration.

```js
// /components/MyElement.js
export default class MyElement extends HTMLElement { ... }
customElements.define('my-element', MyElement) // self-registers
```

---

## Components with a default export (recommended)

The simplest pattern — export the class as default, let `autoDefine` register it:

```js
// /components/MyElement.js
export default class MyElement extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<p>Hello</p>'
  }
}
```

No `customElements.define` call needed in the file.

---

## Scoped scan

Scan only inside a specific container instead of `document.body`:

```js
await autoDefine({ root: '#app' })
```

---

## Watch for dynamic additions

Use `observe: true` to automatically define custom elements added to the DOM after the initial scan. Use an `AbortController` to disconnect the observer when no longer needed.

```js
const controller = new AbortController()

await autoDefine({
  observe: true,
  signal: controller.signal,
})

// later, e.g. on route change or component unmount:
controller.abort()
```

---

## Combined with waitForElementsReady

`autoDefine` and `waitForElementsReady` are complementary:
- `autoDefine` handles **registration** (importing + `customElements.define`)
- `waitForElementsReady` handles **readiness** (waiting + revealing)

Run `autoDefine` first, then wait for readiness:

```js
import { autoDefine } from './src/autoDefine/index.js'
import { waitForElementsReady } from './src/waitForElementsReady/index.js'

await autoDefine({ debug: true })
await waitForElementsReady(document.body, { timeout: 5000 })
```

---

## Debug mode

Log every resolution attempt to the console:

```js
await autoDefine({ debug: true })
// [autoDefine] discovered undefined custom elements: ['my-header', 'data-table']
// [autoDefine] <my-header> trying /components/MyHeader.js
// [autoDefine] <my-header> defined from /components/MyHeader.js
// [autoDefine] <data-table> trying /components/DataTable.js
// [autoDefine] <data-table> trying /components/data-table/DataTable.js
// [autoDefine] <data-table> defined from /components/data-table/DataTable.js
```

---

## Options reference

| Option | Type | Default | Description |
|---|---|---|---|
| `root` | `HTMLElement \| string` | `document.body` | DOM scope to scan |
| `path` | `string` | `'/components/'` | Base path for component files |
| `naming` | `'pascal' \| 'camel' \| 'kebab' \| 'snake'` | `'pascal'` | Tag → filename transformation |
| `observe` | `boolean` | `false` | Watch for dynamically added elements |
| `signal` | `AbortSignal` | — | Disconnect the MutationObserver |
| `debug` | `boolean` | `false` | Log resolution steps to console |
