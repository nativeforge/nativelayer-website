# JavaScript Signals: TC39 Reactive Primitives

Signals are the reactive primitive that underlies modern UI frameworks: SolidJS, Vue 3's `ref`, Angular signals, Preact signals. The TC39 Signals proposal aims to standardize them at the language level. Here's what the proposal brings and why it matters.

## What Is a Signal?

A signal is a value container that tracks when it's read and notifies subscribers when it changes. It's the foundation of fine-grained reactivity:

```js
// Using @tc39/signals polyfill
import { Signal } from '@tc39/signals';

const count = new Signal.State(0);
const doubled = new Signal.Computed(() => count.get() * 2);

// When count changes, doubled recomputes automatically
count.set(5);
console.log(doubled.get()); // 10
```

## State vs Computed

```js
// Signal.State: mutable, settable from outside
const name = new Signal.State('Ada');
name.set('Grace');

// Signal.Computed: derived, read-only, lazy, cached
const greeting = new Signal.Computed(() => `Hello, ${name.get()}`);
console.log(greeting.get()); // "Hello, Grace"

// Computed only recalculates when dependencies change AND it's read
// This is the "lazy pull" model
```

## Signal.subtle: Watcher API

The framework integration point is `Signal.subtle.Watcher`: it allows frameworks to schedule DOM updates when signals change:

```js
const render = new Signal.subtle.Watcher(
  (watcher) => {
    // Called synchronously when any watched signal changes
    // Framework schedules a microtask to re-render
    queueMicrotask(() => {
      for (const signal of watcher.getPending()) {
        updateDOM(signal);
      }
      watcher.watch(); // re-subscribe
    });
  }
);

render.watch(greeting); // observe the computed signal
```

## Why Standardize This?

Today, every framework ships its own signals implementation:

- Solid: `createSignal()`
- Vue: `ref()` / `computed()`
- Angular: `signal()` / `computed()`
- Preact: `signal()`

None of them interoperate. A signal from SolidJS is opaque to Vue. A standard `Signal` would enable:

1. **Shared libraries**: A UI library can be reactive without coupling to a specific framework's primitive
2. **Standard tooling**: DevTools could understand signals natively
3. **Web Components**: reactive primitives without a framework dependency

## Using Signals in a Web Component

```js
import { Signal } from '@tc39/signals';

class CounterElement extends HTMLElement {
  #count = new Signal.State(0);
  #watcher;

  connectedCallback() {
    this.#watcher = new Signal.subtle.Watcher(() => {
      queueMicrotask(() => this.#render());
    });
    this.#watcher.watch(this.#count);
    this.#render();
  }

  #render() {
    this.innerHTML = `
      <button>Count: ${this.#count.get()}</button>
    `;
    this.querySelector('button')
      .addEventListener('click', () => {
        this.#count.set(this.#count.get() + 1);
      });
  }
}
```

## Current Status

TC39 Stage 1. The proposal is active and has strong interest from framework authors across the ecosystem (Solid, Angular, Vue, Svelte have all contributed). The API surface is still being refined. Expect Stage 2 to clarify the `subtle` API.

Polyfills are available: `@tc39/signals` on npm.

---

*Posted in* **PIPELINE** · *May 2026*
