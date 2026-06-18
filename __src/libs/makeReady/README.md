# makeReady

A utility function that injects the `readyElement` lifecycle contract into **any** `HTMLElement` subclass via prototype injection without changing its base class.
Use it to add `el.ready`, `el.isReady`, and `_resolveReady()` to components that ***do not include*** the `readyElement` lifecycle contract.

---

Dependencies: **none**

## Why makeReady ?

`readyElement` is the recommended base class for new components. But many real projects include:

- **Third-party components** whose source you cannot modify.
- **Generated or compiled components** from tools that pick their own base class.
- **Legacy components** that would require a risky refactor to change inheritance.

`makeReady` solves this by injecting the same contract that `readyElement` provides directly onto the prototype, without touching the prototype chain. The component still extends whatever it extended before.

- **Non-destructive.** Prototype chain is unchanged; no existing method is replaced (only `connectedCallback` and `disconnectedCallback` are wrapped).
- **Idempotent.** If the class already has `ready` on its prototype, `makeReady` is a no-op. Safe to call multiple times or defensively.
- **Five resolution strategies.** Covers async callbacks, custom events, attribute sentinels, and synchronous initialization: one call handles any pattern.
- **Returns the class.** Works inline: `customElements.define('tag', makeReady(MyClass))`.

---

## Installation

### Package managers

```bash
npm install @nativelayer.dev/make-ready
```

```bash
pnpm add @nativelayer.dev/make-ready
```

```bash
yarn add @nativelayer.dev/make-ready
```

Then import the function:

```js
import { makeReady } from '@nativelayer.dev/make-ready'
```

### CDN

```html
<script type="module">
  import { makeReady } from 'https://cdn.jsdelivr.net/npm/@nativelayer.dev/make-ready/index.js'
</script>
```

---

## Usage

### Patching a component you write

Call `makeReady` before `customElements.define`. The class gains `el.ready`, `el.isReady`, and `_resolveReady()`.

```js
import { makeReady } from '@nativelayer.dev/make-ready'

class MyFeed extends HTMLElement {
  async connectedCallback() {
    const posts = await fetch('/api/posts').then(r => r.json())
    this.innerHTML = posts.map(p => `<p>${p.title}</p>`).join('')
    this._resolveReady()
  }
}

makeReady(MyFeed)
customElements.define('my-feed', MyFeed)

// elsewhere
const feed = document.querySelector('my-feed')
await feed.ready // resolves after render
```

Or inline:

```js
customElements.define('my-feed', makeReady(MyFeed))
```

### Patching a third-party component

```js
import { makeReady } from '@nativelayer.dev/make-ready'
import ThirdPartyCarousel from '/vendor/carousel.js'

makeReady(ThirdPartyCarousel)
ThirdPartyCarousel.readyEvent = 'carousel-initialized'
customElements.define('fancy-carousel', ThirdPartyCarousel)

const carousel = document.querySelector('fancy-carousel')
await carousel.ready // resolves when 'carousel-initialized' fires
```

---

## Resolution strategies

`makeReady` wraps `connectedCallback` and uses the **first matching strategy** to decide when to call `_resolveReady()`:

### Strategy 1: Already a readyElement

If the class already has `ready` on its prototype (i.e. it extends `readyElement`), `makeReady` is a no-op. Safe to call defensively.

```js
class MyEl extends readyElement { ... }
makeReady(MyEl) // no-op : already has the contract
```

---

### Strategy 2:  `static readyEvent` -> custom event signal

Resolves when a named event fires on the instance. Ideal for third-party components that dispatch a completion event.

```js
makeReady(ThirdPartyWidget)
ThirdPartyWidget.readyEvent = 'widget-ready'

// el.ready resolves when 'widget-ready' fires on the instance
```

```js
// Inside the third-party component (that you cannot modify)
connectedCallback() {
  this.init().then(() => {
    this.dispatchEvent(new Event('widget-ready', { bubbles: true }))
  })
}
```

---

### Strategy 3:  `static readyAttribute` -> attribute sentinel

Resolves when a specific attribute appears on the element. Ideal for components that set an attribute on themselves when done.

```js
makeReady(ThirdPartyWidget)
ThirdPartyWidget.readyAttribute = 'loaded'

// el.ready resolves when the 'loaded' attribute appears
```

```js
// inside the component (that you cannot change)
connectedCallback() {
  setTimeout(() => this.setAttribute('loaded', ''), 500)
}
```

If the attribute is **already present** at connect time (e.g. set in HTML or by a prior script), `ready` resolves immediately without waiting.

```html
<!-- el.ready resolves immediately — attribute already there -->
<third-party-widget loaded></third-party-widget>
```

---

### Strategy 4:  `async connectedCallback` -> returned Promise

If `connectedCallback` returns a Promise (i.e. is declared `async`), `ready` resolves when the Promise settles. This is the standard pattern for components you write.

```js
class MyLoader extends HTMLElement {
  async connectedCallback() {
    const data = await fetch('/api').then(r => r.json())
    this.render(data)
    this._resolveReady()
  }
}

makeReady(MyLoader)
// el.ready resolves after render() and _resolveReady()
```

> **Important:** `connectedCallback` must be declared `async` and must `await` every async call for this strategy to work. A plain `.then()` chain without a `return` is fire-and-forget and resolves before the work finishes.

---

### Strategy 5:  Synchronous fallback

If `connectedCallback` is synchronous (or absent), `ready` resolves immediately after it returns.

```js
class MyBadge extends HTMLElement {
  connectedCallback() {
    this.textContent = this.getAttribute('label') || ''
  }
}

makeReady(MyBadge)
// el.ready resolves as soon as connectedCallback returns
```

---

## Injected members

After calling `makeReady(ComponentClass)`, every instance of the class gains:

| Member | Type | Description |
|--------|------|-------------|
| `ready` | `Promise<void>` | Resolves once `_resolveReady()` has been called |
| `isReady` | `boolean` | `true` after `_resolveReady()` has been called |
| `_resolveReady()` | `() => void` | Signal readiness. Idempotent — resolves exactly once |

On resolution, `_resolveReady()` also:
- Sets `ready=""` attribute on the element
- Dispatches a `ready` event (`bubbles: true, composed: true`)

---

## Static properties

| Property | Type | Strategy | Description |
|----------|------|----------|-------------|
| `ComponentClass.readyEvent` | `string` | 2 | Event name to listen for on the instance |
| `ComponentClass.readyAttribute` | `string` | 3 | Attribute name to watch for on the instance |

Both are optional. If neither is set, strategies 4 and 5 apply automatically based on whether `connectedCallback` is async.

---

## Examples

### Combining with `waitForElementsReady`

Patch all third-party components before registration so `waitForElementsReady` can track them:

```js
import { makeReady }            from '@nativelayer.dev/make-ready'
import { waitForElementsReady } from '@nativelayer.dev/wait-for-elements-ready'
import Carousel  from '/vendor/carousel.js'
import DataGrid  from '/vendor/data-grid.js'

makeReady(Carousel);  Carousel.readyEvent  = 'carousel-ready'
makeReady(DataGrid);  DataGrid.readyEvent  = 'grid-ready'

customElements.define('fancy-carousel', Carousel)
customElements.define('data-grid', DataGrid)

await waitForElementsReady(document.body)
// page reveals only after both vendor components are ready
```

### Checking readiness synchronously

```js
const el = document.querySelector('my-feed')

if (el.isReady) {
  // already done — skip the wait
  doSomethingWith(el)
} else {
  await el.ready
  doSomethingWith(el)
}
```

### Listening to the `ready` event instead of awaiting the Promise

```js
document.addEventListener('ready', (e) => {
  if (e.target.matches('my-feed')) {
    console.log('feed is ready', e.target)
  }
}, { once: true })
```

### Defensive call on an unknown class

```js
// safe even if MyEl already extends readyElement
makeReady(MyEl)
customElements.define('my-el', MyEl)
```

### `Async/await` vs `.then()` : critical distinction

`makeReady` detects async work by checking whether `connectedCallback` **returns a Promise**. `async` functions always do. Plain `.then()` chains without `return` do not.

```js
// ✅ async/await — returns a Promise, makeReady can track it
async connectedCallback() {
  await fetch('/data')
  this.render()
  this._resolveReady()
}

// ❌ .then() without return : fire-and-forget
//    makeReady resolves immediately, before render() runs
connectedCallback() {
  fetch('/data').then(() => {
    this.render()
    this._resolveReady()
  })
}

// ✅ .then() with return, also works
connectedCallback() {
  return fetch('/data').then(() => {
    this.render()
    this._resolveReady()
  })
}
```

> **Rule:** if `connectedCallback` does async work, either:
- declare it `async` and `await` every call
- or `return` the resulting promise chain.

---

## Anti-patterns

### Calling `makeReady` after `customElements.define`

```js
// ❌ too late — instances that connected before this call won't have
//    _resolveReady() called; el.ready hangs forever for them.
customElements.define('my-feed', MyFeed)
makeReady(MyFeed) // prototype is patched, but connectedCallback already ran
```

```js
// ✅ always patch before define
makeReady(MyFeed)
customElements.define('my-feed', MyFeed)
```

---

### Setting `readyEvent` / `readyAttribute` on an instance

These are **static** class properties. Setting them on an instance has no effect because `makeReady` reads them from the constructor, not `this`.

```js
// ❌ does nothing — read from the class, not the instance
const el = document.querySelector('fancy-carousel')
el.readyEvent = 'carousel-ready'
```

```js
// ✅ set on the class before any element connects
makeReady(Carousel)
Carousel.readyEvent = 'carousel-ready'
customElements.define('fancy-carousel', Carousel)
```

---

### Setting `readyEvent` or `readyAttribute` after the element has already connected

Strategies 2 and 3 are evaluated at connect time. Setting the static property after the element is already in the DOM means the listener or observer was never set up — `ready` never resolves.

```js
// ❌ element connects, connectedCallback runs, strategy 2 is not active yet
document.body.appendChild(carousel)
Carousel.readyEvent = 'carousel-ready' // too late
```

```js
// ✅ set before the element connects (or before customElements.define)
Carousel.readyEvent = 'carousel-ready'
customElements.define('fancy-carousel', Carousel)
document.body.appendChild(carousel)
```

---

### Forgetting `_resolveReady()` in a strategy-4 callback

Strategy 4 tracks when the Promise returned by `connectedCallback` settles: it calls `_resolveReady()` automatically after the awaited work. You can also call it manually earlier to resolve at a specific point, but omitting it entirely is fine if you want it to resolve on Promise settlement.

However, if you use strategy 5 (synchronous) but your component actually does async work you forgot to `await` or `return`, `ready` resolves too early:

```js
// ❌ connectedCallback is synchronous: strategy 5 fires immediately
//    even though the real work happens 2s later
connectedCallback() {
  setTimeout(() => {
    this.render()
    // _resolveReady() is called from strategy 5 long before this
  }, 2000)
}
```

```js
// ✅ use a readyEvent or readyAttribute, or make it async
static readyEvent = 'my-component-ready'

connectedCallback() {
  setTimeout(() => {
    this.render()
    this.dispatchEvent(new Event('my-component-ready', { bubbles: true }))
  }, 2000)
}
```

---

### Resolving in the constructor

`_resolveReady()` does not exist until `makeReady` wraps the class and the `connectedCallback` fires. Calling it in the constructor will throw (method not found) or silently do nothing.

```js
// ❌ _resolveReady() is injected by makeReady via prototype;
//    calling it in the constructor resolves before connect
class MyEl extends HTMLElement {
  constructor() {
    super()
    this._resolveReady?.() // no-op at best, fires before any work
  }
}
```

```js
// ✅ call _resolveReady() inside connectedCallback, after the work
class MyEl extends HTMLElement {
  connectedCallback() {
    this.render()
    this._resolveReady()
  }
}
makeReady(MyEl)
```

---

### Awaiting `el.ready` on an element that never connected

If the element was created but never inserted into a connected DOM tree, `connectedCallback` never fires. `_resolveReady()` is never called. `el.ready` waits forever.

```js
// ❌ element created but never attached — ready never resolves
const el = document.createElement('my-feed')
makeReady(MyFeed) // even if the class is patched
await el.ready    // hangs
```

```js
// ✅ attach the element first
const el = document.createElement('my-feed')
document.body.appendChild(el)
await el.ready
```

---

### Expecting `el.ready` to re-resolve after reconnection

`_resolveReady()` is **one-shot**. If an element is removed from the DOM and re-inserted, `connectedCallback` fires again, but `_resolveReady()` is a no-op (already resolved). `el.ready` stays fulfilled; `el.isReady` stays `true`.

```js
document.body.appendChild(el)
await el.ready // resolves ✓

document.body.removeChild(el)
document.body.appendChild(el) // reconnected — connectedCallback fires again

await el.ready  // already resolved — returns immediately ✓
el.isReady      // still true
```

This is intentional. If your component re-initializes on reconnection and you need a new signal, manage that separately (a new Promise, a custom event, etc.).

---

### Setting both `readyEvent` and `readyAttribute` on the same class

Strategy 2 (`readyEvent`) takes priority. `readyAttribute` is ignored.

```js
// ❌ readyAttribute is silently ignored
makeReady(Widget)
Widget.readyEvent    = 'widget-ready'
Widget.readyAttribute = 'loaded'      // never checked
```

```js
// ✅ pick one strategy per class
Widget.readyEvent = 'widget-ready'
```

---

## Edge cases

### Strategy 3: attribute already present at connect time

If the attribute is already on the element when it connects (set in HTML or by prior script), `ready` resolves immediately without setting up a `MutationObserver`.

```js
makeReady(Widget)
Widget.readyAttribute = 'data-loaded'
```

```html
<!-- attribute present in markup → el.ready resolves on first tick -->
<my-widget data-loaded></my-widget>
```

---

### Strategy 3: element removed before the attribute is ever set

If the element leaves the DOM before `readyAttribute` appears, `disconnectedCallback` automatically disconnects the `MutationObserver` so the element can be garbage-collected. If the element is later re-inserted, `connectedCallback` fires again and a fresh observer is set up.

```js
document.body.appendChild(widget)  // observer created
document.body.removeChild(widget)  // observer disconnected automatically
document.body.appendChild(widget)  // new observer created on reconnect
```

---

### `_resolveReady()` is safe to call multiple times

The guard `if (this.__readyResolved) return` makes it idempotent. Calling it from multiple code paths (e.g. both a timeout and a fetch completion) is safe.

```js
async connectedCallback() {
  // belt-and-suspenders: resolve on data OR after 2s, whichever is first
  const timeout = setTimeout(() => this._resolveReady(), 2000)
  const data = await fetch('/api').then(r => r.json())
  clearTimeout(timeout)
  this.render(data)
  this._resolveReady() // first call wins; second is a no-op
}
```

---

### `connectedCallback` throws

If `connectedCallback` throws synchronously, the `makeReady` wrapper propagates the error and `_resolveReady()` is never called. `el.ready` will hang unless you handle errors explicitly.

```js
// ❌ if this throws, _resolveReady() is never called
async connectedCallback() {
  const data = await fetch('/api').then(r => r.json()) // might throw
  this.render(data)
  this._resolveReady()
}
```

```js
// ✅ always resolve in a finally block
async connectedCallback() {
  try {
    const data = await fetch('/api').then(r => r.json())
    this.render(data)
  } catch (err) {
    console.error(err)
    this.renderError()
  } finally {
    this._resolveReady() // always fires
  }
}
```

---

### Subclassing a class that was already patched

If `ParentClass` was patched with `makeReady`, its prototype already has `ready`. When `makeReady` is called on `ChildClass`, check 1 fires (`'ready' in ComponentClass.prototype`) and it is a no-op. The child inherits the patched `connectedCallback` from the parent. This is usually correct, but be aware the `connectedCallback` wrapping logic runs from the parent's copy.

```js
makeReady(ParentClass)
makeReady(ChildClass) // no-op — already has 'ready' via prototype chain
```

If the child class overrides `connectedCallback`, the override is seen by the wrapper already in place on `ParentClass.prototype`, so the behaviour can be unexpected. The safest approach when subclassing a patched class: call `makeReady` only on the root class, and ensure the child calls `super.connectedCallback()`.

---

### `ready` attribute vs `ready` property name conflict

The resolved `ready=""` attribute and the `ready` Promise property share the same name `"ready"`. They are different things: one is a DOM attribute on the element, the other is a JavaScript property on the instance. There is no conflict, but it can be visually confusing in DevTools.

```js
el.ready                 // Promise<void> — JavaScript property
el.hasAttribute('ready') // true after _resolveReady() fires — DOM attribute
```

---

### `connectedCallback` rejection is swallowed in strategy 4

If the Promise returned by `connectedCallback` rejects, the rejection is caught silently by `makeReady`. The component's own `connectedCallback` is responsible for its error handling. `_resolveReady()` is never called in that case — `el.ready` will hang. So guard with `try/finally` if you need guaranteed resolution (see anti-patterns above).

---

### `requestAnimationFrame` throttling in background tabs

`_resolveReady()` defers the final resolution to a `requestAnimationFrame` callback. In browsers with background-tab throttling, `rAF` can be delayed up to several seconds. If your page is revealed via `waitForElementsReady` and the tab is in the background during load, the overlay may persist longer than expected.

In normal foreground usage, `rAF` fires within one frame (~16 ms).

---

## License

MIT License. Copyright (c) 2026 ynck-chrl.

See [LICENSE](./LICENSE) for the full text.
