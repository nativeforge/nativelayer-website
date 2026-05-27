# waitForElementsReady — Usage

Waits until all custom elements inside a target are defined and ready, then adds a CSS class to the target to reveal it.

The reveal is CSS-driven: the target stays visually hidden until every custom element has resolved, at which point the class is added atomically.

---

## Minimal setup

```html
<body>
  <my-header></my-header>
  <my-content></my-content>
</body>

<script type="module">
  import { waitForElementsReady } from './src/waitForElementsReady/index.js'

  await waitForElementsReady()
</script>
```

```css
body {
  visibility: hidden;
}

body.ready {
  visibility: visible;
}
```

`document.body` is the default target. The `ready` class is added once all custom elements inside it are defined and ready.

---

## Custom reveal class

```js
await waitForElementsReady(document.body, { revealClass: 'is-loaded' })
```

```css
body { visibility: hidden; }
body.is-loaded { visibility: visible; }
```

---

## Scoped target

Reveal only a section of the page instead of the entire body.

```html
<div id="app">
  <my-header></my-header>
  <my-dashboard></my-dashboard>
</div>
```

```js
// pass a CSS selector
await waitForElementsReady('#app')

// or a direct reference
const app = document.getElementById('app')
await waitForElementsReady(app)
```

```css
#app { visibility: hidden; }
#app.ready { visibility: visible; }
```

Only elements inside `#app` are tracked. Elements outside are ignored.

---

## Progressive reveal (multiple zones)

Reveal critical content immediately, let secondary content load independently.

```js
// critical zone resolves first
await waitForElementsReady('#critical', { revealClass: 'ready' })

// secondary zone resolves whenever it's ready, non-blocking
waitForElementsReady('#sidebar', { revealClass: 'ready' }).catch(() => {
  document.querySelector('#sidebar').classList.add('ready')
})
```

```css
#critical { visibility: hidden; }
#critical.ready { visibility: visible; }

#sidebar { visibility: hidden; }
#sidebar.ready { visibility: visible; }
```

---

## Timeout safety

Prevent a single broken component from blocking the page indefinitely.

```js
waitForElementsReady(document.body, { timeout: 5000 })
  .catch(err => {
    // err.message: "Timeout waiting for MY-ELEMENT"
    console.warn(err)
    document.body.classList.add('ready') // reveal anyway
  })
```

The timeout applies **per element**. If `MY-ELEMENT` takes longer than 5 000 ms to define or signal readiness, the promise rejects with the element's tag name in the message.

---

## Disabling the mutation observer

For static pages with no dynamically injected elements, disable the observer to avoid the overhead.

```js
await waitForElementsReady(document.body, { observeMutations: false })
```

The observer is enabled by default (`true`). When disabled, only the elements present at call time are tracked.

---

## Disconnecting the observer (SPA route changes)

Use an `AbortController` to stop observing when a route unmounts or a component is destroyed.

```js
const controller = new AbortController()

await waitForElementsReady('#app', { signal: controller.signal })

// on route change or unmount
controller.abort() // observer disconnects, no memory leak
```

---

## Dynamically injected elements

The observer watches for newly added custom elements anywhere inside the target, including those nested inside non-custom wrappers.

```js
// Already running after the initial await
await waitForElementsReady('#app')

// Later, injecting a <div> that contains a custom element
const wrapper = document.createElement('div')
wrapper.innerHTML = '<my-widget></my-widget>'
document.querySelector('#app').appendChild(wrapper)
// observer detects <my-widget> inside the <div>, waits for it, re-adds the class
```

The observer detects custom elements at any depth, not only direct children.

---

## No custom elements found

If the target contains no custom elements, the promise resolves immediately and the class is added right away.

```js
// <div id="plain"><p>No custom elements here</p></div>
await waitForElementsReady('#plain')
// resolves instantly — #plain.ready added synchronously after the microtask
```

---

## Target not found

If the selector or element reference does not resolve, the function throws synchronously (before any async work).

```js
try {
  await waitForElementsReady('#does-not-exist')
} catch (err) {
  console.error(err.message) // "Target element not found"
}
```

---

## Component readiness signals

`waitForElementsReady` recognises three readiness patterns, in priority order:

### 1. `el.ready` Promise (recommended — `ReadyElement`)

```js
import { ReadyElement } from '../readyElement/index.js'

class MyWidget extends ReadyElement {
  async connectedCallback() {
    await this.fetchData()
    this._resolveReady() // signals readiness
  }
}
customElements.define('my-widget', MyWidget)
```

`waitForElementsReady` awaits `el.ready` and continues only after `_resolveReady()` is called.

### 2. `el.whenReady()` method

```js
class MyWidget extends HTMLElement {
  whenReady() {
    return this._initPromise
  }
}
```

If `el.ready` is not a Promise but `el.whenReady` is a function, it is called and its return value is awaited.

### 3. No signal — fallback

If neither `el.ready` nor `el.whenReady` is present, the element is considered ready as soon as `customElements.whenDefined()` resolves. No additional wait.

---

## Separate scan root and reveal target

By default, `target` is both the element scanned and the element that receives `revealClass`. Use the `reveal` option to decouple them.

```js
// Scan inside #app, but add the ready class to document.body
await waitForElementsReady('#app', { reveal: document.body })
```

```css
body { visibility: hidden; }
body.ready { visibility: visible; }
```

Useful when your custom elements live inside a container but the reveal should happen at a higher level (e.g. a shell or layout wrapper).

---

## Debug mode

Log every lifecycle step to the console — definitions, ready signals, observer triggers, and the final reveal.

```js
await waitForElementsReady(document.body, { debug: true })
// [waitForElementsReady] root: <body> | reveal: <body>
// [waitForElementsReady] found 3 custom element(s): ['my-header', 'data-table', 'my-footer']
// [waitForElementsReady] waiting for definition: <my-header>
// [waitForElementsReady] waiting for ready Promise: <data-table>
// [waitForElementsReady] <my-header> ready
// [waitForElementsReady] <data-table> ready
// [waitForElementsReady] <my-footer> ready
// [waitForElementsReady] all ready — adding "ready" to <body>
```

Combined with `reveal`:

```js
await waitForElementsReady('#app', {
  reveal: document.body,
  debug: true,
})
// [waitForElementsReady] root: <div#app> | reveal: <body>
```

---

## Combined with `autoDefine`

Use `autoDefine` to handle registration, then `waitForElementsReady` to handle reveal.

```js
import { autoDefine } from '../autoDefine/index.js'
import { waitForElementsReady } from '../waitForElementsReady/index.js'

await autoDefine({ path: '/components/', debug: true })
await waitForElementsReady(document.body, { timeout: 6000 })
```

---

## Options reference

| Option | Type | Default | Description |
|---|---|---|---|
| `revealClass` | `string` | `"ready"` | CSS class added to the reveal element when all elements are ready |
| `reveal` | `HTMLElement \| string` | `target` | Element that receives `revealClass`. Defaults to `target` |
| `timeout` | `number` | `4000` | Max ms to wait per element before rejecting |
| `observeMutations` | `boolean` | `true` | Watch for dynamically added custom elements |
| `signal` | `AbortSignal` | — | Disconnect the MutationObserver when aborted |
| `debug` | `boolean` | `false` | Log lifecycle steps to the console |
