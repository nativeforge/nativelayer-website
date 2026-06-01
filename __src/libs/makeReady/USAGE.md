# makeReady — Usage

Injects the `readyElement` lifecycle contract into **any** `HTMLElement` subclass via prototype injection — no base class change required.

After applying, every instance gains:
- `el.ready` — a `Promise` that resolves once the element is functional
- `el.isReady` — `boolean`, `true` after ready resolved
- `el._resolveReady()` — call this manually in advanced cases

---

## Quick start

```js
import { makeReady } from '/__src/libs/makeReady/index.js'

class MyElement extends HTMLElement {
  async connectedCallback() {
    const data = await fetch('/api/data').then(r => r.json())
    this.render(data)
  }
}

makeReady(MyElement)
customElements.define('my-element', MyElement)

// elsewhere
const el = document.querySelector('my-element')
await el.ready // resolves after render(data) has been called
```

---

## ⚠️ async/await vs .then() — critical distinction

`makeReady` detects async work by checking whether `connectedCallback` **returns a Promise**. `async` functions always do. Plain `.then()` callbacks do not.

```js
// ✅ async/await — always returns a Promise, makeReady can wait for it
async connectedCallback() {
  await fetch('/data')
  this.render()
}

// ❌ .then() — returns undefined, Promise is fire-and-forget
//    makeReady resolves immediately, before render() runs
connectedCallback() {
  fetch('/data').then(() => this.render())
}
```

**Rule:** if `connectedCallback` does any async work, it must be declared `async` and must `await` every async call. Never use `.then()` inside `connectedCallback` without returning the resulting promise.

---

## Resolution strategies

`makeReady` uses the first strategy that matches, in this order:

### 1. Already a readyElement

If the class already has `ready` on its prototype (i.e. it already extends `readyElement`), `makeReady` is a no-op.

```js
class MyElement extends readyElement { ... }
makeReady(MyElement) // does nothing, safe to call
```

---

### 2. `static readyEvent` — custom event signal

For components that dispatch a specific event when ready (e.g. third-party elements you don't control).

```js
class ThirdPartyElement extends HTMLElement {
  connectedCallback() {
    loadSomething().then(() => {
      this.dispatchEvent(new Event('third-party-ready'))
    })
  }
}

makeReady(ThirdPartyElement)
ThirdPartyElement.readyEvent = 'third-party-ready'

// el.ready resolves when 'third-party-ready' fires
```

---

### 3. `static readyAttribute` — attribute sentinel

For components that set an attribute on themselves when done (e.g. `[ready]`, `[loaded]`).

```js
class ThirdPartyWidget extends HTMLElement {
  connectedCallback() {
    setTimeout(() => this.setAttribute('loaded', ''), 500)
  }
}

makeReady(ThirdPartyWidget)
ThirdPartyWidget.readyAttribute = 'loaded'

// el.ready resolves when the 'loaded' attribute appears
```

---

### 4. `async connectedCallback` — returned Promise

The standard pattern for components you write. Declare `connectedCallback` as `async` and `await` all async work.

```js
class MyFeed extends HTMLElement {
  async connectedCallback() {
    const posts = await fetch('/api/posts').then(r => r.json())
    this.innerHTML = posts.map(p => `<p>${p.title}</p>`).join('')
  }
}

makeReady(MyFeed)
// el.ready resolves after innerHTML is set
```

---

### 5. Synchronous fallback

If `connectedCallback` is synchronous (or absent), `ready` resolves immediately after it returns.

```js
class MyBadge extends HTMLElement {
  connectedCallback() {
    this.textContent = this.getAttribute('label')
  }
}

makeReady(MyBadge)
// el.ready resolves as soon as connectedCallback returns
```

---

## Combining with `waitForElementsReady`

`makeReady` and `waitForElementsReady` are designed to work together. Apply the lifecycle to your components before registering them, then use `waitForElementsReady` to coordinate page reveal.

```js
import { makeReady }             from '/__src/libs/makeReady/index.js'
import { waitForElementsReady }  from '/__src/libs/waitForElementsReady/index.js'
import ThirdPartyCarousel        from '/vendor/carousel.js'

// Patch third-party element
makeReady(ThirdPartyCarousel)
ThirdPartyCarousel.readyEvent = 'carousel-ready'
customElements.define('third-party-carousel', ThirdPartyCarousel)

// Wait for everything before revealing the page
await waitForElementsReady(document.body)
```

---

## Options reference

`makeReady` takes a single argument — the component class — and returns it (mutated in-place).

| Static property | Type | Description |
|---|---|---|
| `ComponentClass.readyEvent` | `string` | Event name to listen for on the instance (strategy 2) |
| `ComponentClass.readyAttribute` | `string` | Attribute name to watch for on the instance (strategy 3) |

Both are optional. If neither is set, strategies 4 and 5 apply automatically.
