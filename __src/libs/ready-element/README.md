# readyElement

A minimal, deterministic convention for signaling and awaiting the *actually ready* state of Web Components — plus an orchestrator to coordinate them all before revealing the page.

**Two primitives, zero dependencies, no framework coupling.**

---

## The Problem

Native Web Components provide **no standard signal** indicating that a component is:
- connected
- rendered
- functional

`customElements.whenDefined()` only tells you the **class is registered**, not that an instance is usable. This leads to silent race conditions, partially rendered UIs, and fragile heuristics (`setTimeout`, boolean flags).

This library introduces an **availability contract** and a **readiness orchestrator**.

---

## Quick Start

```js
import { ReadyElement } from './src/readyElement.js'
import { waitForElementsReady } from './src/waitForElementReady.js'
```

---

## `ReadyElement`

A base class that every structural component can extend. It exposes a single `ready` promise.

### Interface Contract

```ts
interface ReadyComponent extends HTMLElement {
  readonly ready: Promise<void>
}
```

**Guarantees:**
- `ready` exists from instantiation
- `ready` resolves exactly **once**
- `ready` never rejects
- `ready` means **functional**, not decorative

### Implementation

```js
export class ReadyElement extends HTMLElement {
  constructor() {
    super()

    this._readyResolved = false

    this.ready = new Promise(resolve => {
      this._resolveReady = () => {
        if (this._readyResolved) return

        this._readyResolved = true
        resolve()
        this.dispatchEvent(new Event('ready'))
      }
    })
  }
}
```

**Strict rules:**
- `_resolveReady()` is private by convention
- no other part of the code resolves `ready`
- no business logic in this class

### Usage in a Component

```js
class UserProfile extends ReadyElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.innerHTML = `<p>User profile</p>`

    this._resolveReady()
  }
}

customElements.define('user-profile', UserProfile)
```

### Prohibitions

- Do not call `_resolveReady()` in the constructor
- Do not resolve `ready` multiple times
- Do not await `ready` in another component's constructor

---

## `waitForElementsReady`

An orchestrator that discovers all custom elements in a subtree, waits for their definitions and readiness signals, then reveals the container.

### How It Works

1. Discovers all custom elements inside a root
2. Waits for each element's `customElements.whenDefined()`
3. Waits for each element's readiness signal
4. Adds a reveal class to the root
5. Optionally observes mutations for dynamically added elements

### Readiness Detection

The orchestrator checks each element for one of the following (in order):

| Signal | Type | Description |
|---|---|---|
| `el.ready` | `Promise<void>` | Preferred — the `ReadyElement` contract |
| `el.whenReady()` | `() => Promise<void>` | Alternative method-based signal |
| `el.hasAttribute("ready")` | attribute | Declarative fallback |
| *(none)* | — | Element is considered ready immediately |

### API

```js
await waitForElementsReady(target, options)
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `target` | `HTMLElement \| string` | `document.body` | Root element or CSS selector |
| `options.revealClass` | `string` | `"ready"` | Class added to root when all elements are ready |
| `options.timeout` | `number` | `4000` | Max wait per element (ms) before rejecting |
| `options.observeMutations` | `boolean` | `true` | Watch for dynamically added custom elements |

### Full Example

```html
<body class="app">
  <my-header></my-header>
  <my-dashboard></my-dashboard>
</body>
```

```js
import { waitForElementsReady } from './src/waitForElementReady.js'

waitForElementsReady(document.body, {
  revealClass: 'app--ready',
})
```

```css
body {
  visibility: hidden;
}

body.app--ready {
  visibility: visible;
}
```

---

## Consumer-Side API

### Simple Await

```js
await element.ready
```

### Multi-Component Orchestration

```js
await Promise.all([
  header.ready,
  sidebar.ready,
  content.ready,
])
```

### Interop Event

```js
element.addEventListener('ready', () => {
  // component ready
})
```

---

## Integration with `content-visibility`

`content-visibility: auto` defers DOM rendering **without any JavaScript signal**. This can cause a component to be marked ready but never actually rendered, or listeners attached to a non-materialized DOM.

### Recommended Pattern

#### CSS

```css
:host {
  content-visibility: auto;
  contain-intrinsic-size: 300px;
  visibility: hidden;
}

:host(.ready) {
  visibility: visible;
}
```

#### JavaScript

```js
connectedCallback() {
  this.attachShadow({ mode: 'open' })
  this.shadowRoot.innerHTML = `<slot></slot>`

  requestAnimationFrame(() => {
    this._resolveReady()
    this.classList.add('ready')
  })
}
```

`requestAnimationFrame` guarantees the browser has committed the render cycle, preventing a premature `ready`.

---

## Anti-Patterns

### The Dangerous Pattern

```js
connectedCallback() {
  this.innerHTML = `<child-component></child-component>`

  const child = this.querySelector('child-component')
  child.doSomething() // child may not be defined, connected, or rendered
}
```

Silent race condition.

### The Fix

```js
connectedCallback() {
  this.innerHTML = `<child-component></child-component>`

  const child = this.querySelector('child-component')

  child.ready.then(() => {
    child.doSomething()
  })
}
```

Explicit dependency. Deterministic execution. Testable component.

---

## Relationship with `customElements.whenDefined`

```
whenDefined  = class registered
ready        = component functional
```

Use both together:

```js
await customElements.whenDefined('child-component')
const el = document.querySelector('child-component')
await el.ready
```

---

## Golden Rules

1. Every structural component exposes `ready`
2. `ready` resolves only once
3. `ready` ≠ animations finished
4. Parents orchestrate, children signal
5. No inter-component access without `ready`

---

## License

MIT
