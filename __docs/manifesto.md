# **nativelayer** manifesto

> *A composable layer for the web platform.*

## What *nativelayer* is

`nativelayer` is not a framework. It is not a meta-framework. It is not an opinion about how you should write your entire application.

It is a **layer**. A thin set of librairies and packages based on web primitives that sit directly on top of the web platform without hiding it. Each piece is small, independent, and highly extensible. Together they form a coherent system for building modular web interfaces that behave like the platform.

The name is literal.

- ***native***: rooted in what the browser already provides.
- ***layer***: adding on top, not replacing.

## The problem *nativelayer* solves

Modern web development has a compounding abstraction problem.

Each generation of tooling adds a layer of indirection to solve a problem introduced by the previous layer. Virtual DOM to solve reactive rendering. Compilers to solve JSX. Bundlers to solve module resolution. Hydration to solve SSR. Islands to solve over-hydration. The stack grows vertically while the platform evolves horizontally, and most developers lose track of what the browser is already capable of doing for free.

`nativelayer` asks a different question: **what would the stack look like if you started from what the platform already provides, and added only what is genuinely missing?**

The answer is a small set of libraries and components, each solving one specific problem, each written directly against browser APIs, none requiring a build step to run.

## Native capabilities

The web platform has quietly accumulated a set of powerful, low-level primitives that most developers never reach for, partly because frameworks abstract them away before they are ever encountered, and partly because their full capabilities are rarely documented together.

These are not obscure experiments. They are stable, broadly supported, and already shipping in every modern browser:

- **Custome Element** — define your own `HTML` tags with full lifecycle hooks (`connectedCallback`, `disconnectedCallback`, `attributeChangedCallback`). The browser treats them as first-class elements: they participate in the DOM, receive events, and work with any existing `HTML` tooling.

- **Shadow DOM** — attach an encapsulated subtree to any element. Styles defined inside a shadow root do not leak out; external styles do not leak in. Layout, theming, and behaviour can be fully self-contained without naming conventions or CSS-in-JS.

- **Slots API** — a native composition model for Web Components. Light DOM content is projected into named or default slots inside a shadow root, enabling component APIs that look and feel like standard `HTML` attributes and children.

- **ES Modules** — the browser loads, caches, and graph-resolves JavaScript modules natively. No bundler required to split code, share utilities, or lazy-load features. `import` and `export` are platform primitives.

- **Fetch** — a promise-based, streaming-capable HTTP API built into the global scope. Handles cancellation via `AbortController`, supports `ReadableStream` for progressive responses, and requires no wrapper library for the vast majority of data-fetching patterns.

- **CSS Custom Properties** — scoped, inheritable, animatable variables that cascade through the DOM. When combined with `@property`, they become typed and interpolatable, enabling design tokens, runtime theming, and component-level overrides without JavaScript.

- **Modern CSS APIs** — a wave of layout and scoping primitives that remove entire categories of JavaScript hacks:
  - `@container` — style elements based on their parent's size, not the viewport
  - `:host` and `:host-context()` — style the shadow host from within the component
  - `@layer` — explicit cascade layers for predictable specificity management
  - `@starting-style` — define entry animations without JavaScript
  - `color-mix()`, `oklch()` — perceptually uniform colour manipulation in CSS alone

None of these require a framework, a compiler, or a build step. They are the surface that `nativelayer` builds on.

## The design principles

### The platform is the runtime

The browser is not a deployment target to be compiled toward. It is a fully capable runtime with layout engines, animation APIs, form validation, accessibility semantics, module loading, and reactive observation built in. Every abstraction that duplicates these capabilities carries a cost: weight, indirection, and divergence from what the platform does natively.

`nativelayer` treats the browser as the primary API surface. It extends it; it does not wrap it.

### One problem, one package

Every piece of `nativelayer` does exactly one thing.

- `restate` manages reactive state.
- `reflectx` binds state to the DOM.
- `routerx` handles navigation.
- `re-md` renders markdown. None of them depend on each other. You can use any one of them independently, in any project, without the others.

This is not minimalism as aesthetic. It is minimalism as correctness. A library that does one thing can be understood in full, tested in isolation, replaced without cascading changes, and evolved without breaking contracts.

### No build by default

Every `nativelayer` library and component runs directly in the browser as written. No compiler. No bundler. No transpilation step. Native ES modules handle imports. The browser handles the rest.

A build step is a legitimate choice for production optimization — minification, tree-shaking, caching. It is not a prerequisite for authoring or running code. `nativelayer` treats tooling as optional, not foundational.

### Attributes are the API

`Custome Element` receive configuration through `HTML` attributes, not JavaScript constructor arguments or prop objects. This means your component API is readable in the `HTML` source, inspectable in DevTools, accessible to CSS via attribute selectors, and overridable without touching JavaScript.

```html
<monitor-element
  app="main"
  path="/__src/components/"
  brand="nativelayer.dev"
  show-duration="400">
</monitor-element>
```

Every attribute in `nativelayer` has a sensible default. You opt into complexity; you do not opt out of it.

### Transparency over magic

Every behavior in `nativelayer` is traceable to a standard browser mechanism. `Shadow DOM` for style encapsulation. Custom events for component communication. CSS custom properties for theming. ES module imports for dependency resolution. `MutationObserver` and `IntersectionObserver` for DOM tracking.

There is no proprietary reactivity system hidden behind a compiler. No private rendering queue. No synthetic event system. What you see in DevTools is what the code actually does.

### Composability over inheritance

Components are assembled in `HTML`, ***not composed in JavaScript***.
***Content***, ***layout***, and ***behavior*** are separated by their natural concerns :

- ***HTML*** for structure
- ***CSS*** for presentation
- ***JavaScript*** for behavior

Components expose ***named `slots`*** for ***content projection***, `CSS` custom properties for ***theming***, and `events` for ***communication***. They do not assume anything about their parent or sibling context.

## The library ecosystem

### `restate` for reactive state

`restate` is a reactive state container built on ES6 Proxies. It wraps a plain JavaScript object and returns a reactive proxy. Any property mutation triggers registered change handlers.

```js
import { restate } from '/libs/restate/restate.esm.min.js'

const state = restate({ count: 0, label: 'items' })

state.$onChange(() => {
  countEl.textContent = state.count
})

state.count++
```

The API surface is minimal: `$onChange`, `$set`, `$computed`, `$methods`, `$watch`, `$destroy`. No observables. No subscriptions to unsubscribe. No action creators. State is a plain object you mutate; the proxy intercepts and propagates.

**~2.8 Kb minified. Zero dependencies.**

### `reflectx` for DOM binding

`reflectx` is a declarative DOM binding engine. It reads `x-*` directives from `HTML` elements and synchronizes them with a state object. It works on any element (custom or native) and requires no component wrapper to function.

```html
<ul>
  <template x-for="item of items">
    <li x-key="item.id" x-text="item.label" x-class="(active, item.active)"></li>
  </template>
</ul>
```

```js
reflectx(state, container)
state.$onChange(() => reflectx(state, container))
```

`reflectx` does not own the DOM. It applies updates imperatively when called. This makes it composable with any other code that touches the same elements — there is no reconciliation conflict, no lifecycle to manage, no mounting API.

**~5.4 Kb minified. Zero dependencies.**

### `routerx` for navigation

`routerx` is a router that works in both multi-page (MPA) and single-page (SPA) contexts. It intercepts link clicks and `popstate` events, resolves routes, and renders matched content, without requiring a full page reload.

It is designed for static hosting: no server-side rendering, no rewrite rules required for basic usage. It reads the URL directly and maps it to a page module.

```js
import { router } from '/__src/js/router.js'
router.start()
```

**~3.4 Kb minified. Zero dependencies.**

### `<re-md>` for markdown rendering

`<re-md>` is a web component that fetches a markdown source, parses it, and renders it as styled `HTML` inside a `Shadow DOM`. It handles headers, code blocks, tables, blockquotes, and links natively.

```html
<re-md src="/docs/readme.md"></re-md>
```

Because it is a `custom element`, it integrates into any `HTML` page without any surrounding framework. Because it uses `Shadow DOM`, its styles are encapsulated and do not leak.

**~5.4 Kb minified. Zero dependencies.**

### `readyElement`

### `autoDefine`

### `waitForReadyElements`

## The component system

### Web Components as the unit of composition

Every UI primitive in `nativelayer` is a `Custom Element`. `<top-bar>`, `<page-container>`, `<flex-container>`, `<base-hero>`, `<base-card>`, `<base-quote>`, `<base-footer>` — each is a self-contained, reusable element that exposes its API through attributes, slots, and CSS custom properties.

This is not a stylistic choice. `Custome Element` are a browser standard. They are parsed by the `HTML` parser. They upgrade gracefully. They work with any toolchain or none. They will still work in ten years.

### `Shadow DOM` for encapsulation

Components that own their visual presentation use `Shadow DOM`. This means their internal styles cannot leak out, and external styles cannot accidentally break them. Theming is done intentionally through CSS custom properties, which pierce the shadow boundary by design.

```css
/* Page-level theming */
:root {
  --accent-color-hsl: 220 100% 50%;
  --space-unit: 0.5rem;
  --ff-2: 'Inter', sans-serif;
}

/* The component picks these up automatically */
top-bar {
  /* no overrides needed; --accent-color-hsl is inherited */
}
```

### Slots for content projection

Components do not own their content. They provide named slots for pages and parent components to fill:

```html
<base-hero>
  <h1 slot="title">Web native modular system.</h1>
  <p slot="description">A composable layer for modern web applications.</p>
</base-hero>
```

The component controls layout and presentation. The page controls content. These concerns remain independent and composable.

## The loading system

One of the practical challenges of building with **Custome Element**, particularly on pages that use many of them, is the flash of unstyled content (FOUC) that occurs between the moment the `HTML` is parsed and the moment JavaScript finishes defining and upgrading each element.

`nativelayer` includes a coherent, layered system for managing this.

### `ready-element` — the async-ready base class

`ready-element` is a base class that **Custome Elements** can extend to signal when their async initialization is complete. It exposes a `ready` Promise and a `_resolveReady()` method.

```js
class MyHeader extends readyElement {
  async connectedCallback() {
    super.connectedCallback?.()
    await this.fetchData()
    this._resolveReady() // signals: I am ready
  }
}
```

This creates a standard contract: any element extending `readyElement` can be waited on externally.

### `autoDefine` — automatic element discovery and import

`autoDefine` scans a container for all `custom element` tags, resolves their source file paths from a base path and naming convention, and dynamically imports them.

```js
await autoDefine({ root: document.querySelector('main'), path: '/__src/components/' })
```

This means pages do not need a long list of manual imports. Add a component to the `HTML`; `autoDefine` finds it and loads it.

### `waitForElementsReady` — coordinated readiness

`waitForElementsReady` scans a container, waits for every `custom element` to be defined via `customElements.whenDefined`, and — for elements that extend `readyElement` — waits for their `ready` Promise to resolve.

```js
await waitForElementsReady(document.querySelector('main'), {
  revealClass: 'app-ready',
})
```

When all elements are ready, it adds a class (or attribute) to a reveal element. The page CSS can then animate the content in.

### `monitor-element` — the verbose overlay

`<monitor-element>` combines `autoDefine` and `waitForElementsReady` into a self-contained loading overlay that shows each component by name as it becomes ready. It is useful during development and on pages where you want to communicate loading progress in detail.

```html
<monitor-element app="main" path="/__src/components/" brand="nativelayer.dev"></monitor-element>
```

### `loader-element` — the minimal overlay

`<loader-element>` provides the same loading orchestration as `<monitor-element>` but replaces the component list with a single progress bar. Each component that becomes ready advances the bar by one step, animated by a configurable CSS transition.

```html
<loader-element app="main" path="/__src/components/" step-duration="600"></loader-element>
```

Both overlays fade out and remove themselves from the DOM when loading is complete. The page CSS controls the reveal animation using attribute selectors:

```css
main:not([ready]) { opacity: 0; }
main[ready]       { opacity: 1; transition: opacity 0.4s ease; }
```

## The CSS architecture

`nativelayer`'s CSS is built on custom properties as the primary abstraction. Design tokens live on `:root` — colors in HSL space, spacing as a base unit, typography scales — and components consume them directly. There are no utility classes, no CSS-in-JS, no scoped hash suffixes.

```css
:root {
  --space-unit: 0.5rem;
  --fcolor-hsl: 0 0% 8%;
  --bcolor-hsl: 0 0% 98%;
  --accent-color-hsl: 220 100% 50%;
  --ff-1: 'Arimo', sans-serif;
  --ff-2: 'Inter', sans-serif;
  --ff-3: 'JetBrains Mono', monospace;
}
```

HSL space is used deliberately. Components can vary lightness and alpha of any color using the slash syntax without knowing the specific color value:

```css
background: hsla(var(--accent-color-hsl) / 0.08);
border: 1px solid hsla(var(--fcolor-hsl) / 0.12);
```

This means theming a page, including all components, requires changing a handful of variables on `:root`. No component needs to be touched.

## Where *nativelayer* fits

`nativelayer` is well-suited for:

- **Content sites and documentation**: projects where long-term maintainability, SEO, and progressive enhancement matter more than hot-reloading and JSX
- **Design systems**: components that need to be framework-agnostic, stable, and inspectable in their native form
- **Multi-page and single-page applications**: routing with guards and auth via `routerx`, centralized reactive state via `restate`, and directive-based DOM binding via `reflectx` cover the architecture of most real applications, without a build step
- **Hybrid applications**: as the UI layer alongside any server-rendered `HTML`, in environments where tooling is constrained
- **Component libraries for distribution**: shipping zero-dependency web components means consumers can use them in React, Vue, Svelte, or plain `HTML` without adaptation

It is not optimized for:

- **Applications that require full server-side rendering with client-side hydration**: `reflectx` can run in Node.js via jsdom or happy-dom to generate HTML server-side, but whether it attaches cleanly to already-rendered DOM without re-rendering is not guaranteed. True streaming SSR with state handoff is outside the current scope.
- **Teams fully committed to a specific framework ecosystem**: `nativelayer` does not provide framework integrations, adapters, a CLI, or scaffolding tools. There is no established large-team convention system out of the box.

## The deeper position

The argument for `nativelayer` is not that frameworks are wrong. It is that **the decision to use a framework is often made reflexively**, before the actual requirements of the project are known, and that developers who do not have a fluent relationship with the platform have no basis for making that decision consciously.

A developer who deeply understands `Custome Element`, the `Shadow DOM`, `CSS custom properties`, `ES modules`, the `History API`, and `fetch` can look at a project and make an informed choice: this problem warrants a framework; this one does not. A developer who has only worked inside framework abstractions cannot make that choice. They have only one tool.

`nativelayer` is, among other things, an argument for learning the platform before reaching for the abstraction.

> "Any fool can write code that a computer can understand. Good programmers write code that humans can understand." — Martin Fowler

The web platform is the most widely deployed, most durably specified software runtime in history. Code written against it directly tends to outlast the framework it could have been written in. That is not a coincidence.

## Summary

| Concern | `nativelayer` approach |
|---------|---------------------|
| State management | `restate` — ES6 Proxy, ~2.8 Kb |
| DOM binding | `reflectx` — directive-based, ~5.4 Kb |
| Routing | `routerx` — MPA/SPA, ~3.4 Kb |
| Markdown | `<re-md>` — web component, ~5.4 Kb |
| UI primitives | `Custome Element` with `Shadow DOM` and slots |
| Theming | CSS custom properties on `:root` |
| Loading orchestration | `readyElement` + `autoDefine` + `waitForElementsReady`  |
| Loading overlays | `<monitor-element>` (verbose) or `<loader-element>` (minimal) |
| Build step | Optional — everything runs natively |
| Total framework overhead | 0 Kb |

---

*`nativelayer` — Extend the platform. Do not replace it.*
