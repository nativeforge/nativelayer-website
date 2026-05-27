# nativelayer — manifesto

> *A composable layer for the web platform.*

## What nativelayer is

nativelayer is not a framework. It is not a meta-framework. It is not an opinion about how you should write your entire application.

It is a **layer** — a thin, deliberate set of primitives that sit directly on top of the web platform without hiding it. Each piece is small, independent, and transparent. Together they form a coherent system for building modular web interfaces that behave like the platform, not against it.

The name is literal. *native* — rooted in what the browser already provides. *layer* — adding just enough, never replacing.

## The problem nativelayer solves

Modern web development has a compounding abstraction problem.

Each generation of tooling adds a layer of indirection to solve a problem introduced by the previous layer. Virtual DOM to solve reactive rendering. Compilers to solve JSX. Bundlers to solve module resolution. Hydration to solve SSR. Islands to solve over-hydration. The stack grows vertically while the platform evolves horizontally, and most developers lose track of what the browser was already capable of doing for free.

nativelayer asks a different question: **what would the stack look like if you started from what the platform already provides, and added only what is genuinely missing?**

The answer is a small set of libraries and components, each solving one specific problem, each written directly against browser APIs, none requiring a build step to run.

## The design principles

### 1. The platform is the runtime

The browser is not a deployment target to be compiled toward. It is a fully capable runtime with layout engines, animation APIs, form validation, accessibility semantics, module loading, and reactive observation built in. Every abstraction that duplicates these capabilities carries a cost: weight, indirection, and divergence from what the platform does natively.

nativelayer treats the browser as the primary API surface. It extends it; it does not wrap it.

### 2. One problem, one package

Every piece of nativelayer does exactly one thing. `restate` manages reactive state. `reflectx` binds state to the DOM. `routerx` handles navigation. `re-md` renders markdown. None of them depend on each other. You can use any one of them independently, in any project, without the others.

This is not minimalism as aesthetic. It is minimalism as correctness. A library that does one thing can be understood in full, tested in isolation, replaced without cascading changes, and evolved without breaking contracts.

### 3. No build by default

Every nativelayer library and component runs directly in the browser as written. No compiler. No bundler. No transpilation step. Native ES modules handle imports. The browser handles the rest.

A build step is a legitimate choice for production optimization — minification, tree-shaking, caching. It is not a prerequisite for authoring or running code. nativelayer treats tooling as optional, not foundational.

### 4. Attributes are the API

Custom elements receive configuration through HTML attributes, not JavaScript constructor arguments or prop objects. This means your component API is readable in the HTML source, inspectable in DevTools, accessible to CSS via attribute selectors, and overridable without touching JavaScript.

```html
<monitor-element
  app="main"
  path="/__src/components/"
  brand="nativelayer.dev"
  show-duration="600"
></monitor-element>
```

Every attribute in nativelayer has a sensible default. You opt into complexity; you do not opt out of it.

### 5. Transparency over magic

Every behavior in nativelayer is traceable to a standard browser mechanism. Shadow DOM for style encapsulation. Custom events for component communication. CSS custom properties for theming. ES module imports for dependency resolution. `MutationObserver` and `IntersectionObserver` for DOM tracking.

There is no proprietary reactivity system hidden behind a compiler. No private rendering queue. No synthetic event system. What you see in DevTools is what the code actually does.

### 6. Composability over inheritance

Components are assembled in HTML, not composed in JavaScript. Layout, content, and behavior are separated by their natural concerns — HTML for structure, CSS for presentation, JavaScript for behavior — and kept in that order.

Components expose named slots for content projection, CSS custom properties for theming, and events for communication. They do not assume anything about their parent or sibling context.

## The library ecosystem

### `restate` — reactive state

`restate` is a reactive state container built on ES6 Proxies. It wraps a plain JavaScript object and returns a reactive proxy. Any property mutation triggers registered change handlers.

```js
import { restate } from '/libs/restate/restate.esm.min.js'

const state = restate({ count: 0, label: 'items' })

state.$onChange(() => {
  countEl.textContent = state.count
})

state.count++
```

The API surface is minimal: `$onChange`, `$set`, `$reset`. No observables. No subscriptions to unsubscribe. No action creators. State is a plain object you mutate; the proxy intercepts and propagates.

**~2.8 Kb minified. Zero dependencies.**

### `reflectx` — DOM binding

`reflectx` is a declarative DOM binding engine. It reads `x-*` directives from HTML elements and synchronizes them with a state object. It works on any element — custom or native — and requires no component wrapper to function.

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

### `routerx` — navigation

`routerx` is a client-side router that works in both multi-page (MPA) and single-page (SPA) contexts. It intercepts link clicks and `popstate` events, resolves routes, and renders matched content — without requiring a full page reload.

It is designed for static hosting: no server-side rendering, no rewrite rules required for basic usage. It reads the URL directly and maps it to a page module.

```js
import { router } from '/__src/js/router.js'
router.start()
```

**~3.4 Kb minified. Zero dependencies.**

### `<re-md>` — markdown rendering

`<re-md>` is a web component that fetches a markdown source, parses it, and renders it as styled HTML inside a shadow DOM. It handles headers, code blocks, tables, blockquotes, and links natively.

```html
<re-md src="/docs/readme.md"></re-md>
```

Because it is a custom element, it integrates into any HTML page without any surrounding framework. Because it uses shadow DOM, its styles are encapsulated and do not leak.

**~5.4 Kb minified. Zero dependencies.**

## The component system

### Web Components as the unit of composition

Every UI primitive in nativelayer is a Custom Element. `<top-bar>`, `<page-container>`, `<flex-container>`, `<base-hero>`, `<base-card>`, `<base-quote>`, `<base-footer>` — each is a self-contained, reusable element that exposes its API through attributes, slots, and CSS custom properties.

This is not a stylistic choice. Custom Elements are a browser standard. They are parsed by the HTML parser. They upgrade gracefully. They work with any toolchain or none. They will still work in ten years.

### Shadow DOM for encapsulation

Components that own their visual presentation use shadow DOM. This means their internal styles cannot leak out, and external styles cannot accidentally break them. Theming is done intentionally through CSS custom properties, which pierce the shadow boundary by design.

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

One of the practical challenges of building with custom elements — particularly on pages that use many of them — is the flash of unstyled content (FOUC) that occurs between the moment the HTML is parsed and the moment JavaScript finishes defining and upgrading each element.

nativelayer includes a coherent, layered system for managing this.

### `ready-element` — the async-ready base class

`ready-element` is a base class that custom elements can extend to signal when their async initialization is complete. It exposes a `ready` Promise and a `_resolveReady()` method.

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

`autoDefine` scans a container for all custom element tags, resolves their source file paths from a base path and naming convention, and dynamically imports them.

```js
await autoDefine({ root: document.querySelector('main'), path: '/__src/components/' })
```

This means pages do not need a long list of manual imports. Add a component to the HTML; `autoDefine` finds it and loads it.

### `waitForElementsReady` — coordinated readiness

`waitForElementsReady` scans a container, waits for every custom element to be defined via `customElements.whenDefined`, and — for elements that extend `readyElement` — waits for their `ready` Promise to resolve.

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

nativelayer's CSS is built on custom properties as the primary abstraction. Design tokens live on `:root` — colors in HSL space, spacing as a base unit, typography scales — and components consume them directly. There are no utility classes, no CSS-in-JS, no scoped hash suffixes.

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

This means theming a page — including all components — requires changing a handful of variables on `:root`. No component needs to be touched.

## Where nativelayer fits

nativelayer is well-suited to:

- **Content sites and documentation** — where long-term maintainability, SEO, and progressive enhancement matter more than hot-reloading and JSX
- **Design systems** — where components need to be framework-agnostic, stable, and inspectable in their native form
- **Hybrid applications** — as the UI layer alongside any server-rendered HTML, used without a build step in environments where tooling is constrained
- **Component libraries for distribution** — where shipping zero-dependency web components means consumers can use them in React, Vue, Svelte, or plain HTML without adaptation

It is not optimized for:

- Applications with extremely complex client-side state (form builders, spreadsheets, collaborative editors) — these benefit from frameworks that are purpose-built for that complexity
- Teams that are fully committed to a specific framework ecosystem — nativelayer does not provide integrations or adapters

## The deeper position

The argument for nativelayer is not that frameworks are wrong. It is that **the decision to use a framework is often made reflexively**, before the actual requirements of the project are known, and that developers who do not have a fluent relationship with the platform have no basis for making that decision consciously.

A developer who deeply understands Custom Elements, the Shadow DOM, CSS custom properties, ES modules, the History API, and `fetch` can look at a project and make an informed choice: this problem warrants a framework; this one does not. A developer who has only worked inside framework abstractions cannot make that choice. They have only one tool.

nativelayer is, among other things, an argument for learning the platform before reaching for the abstraction.

> "Any fool can write code that a computer can understand. Good programmers write code that humans can understand." — Martin Fowler

The web platform is the most widely deployed, most durably specified software runtime in history. Code written against it directly tends to outlast the framework it could have been written in. That is not a coincidence.

## Summary

| Concern | nativelayer approach |
|---------|---------------------|
| State management | `restate` — ES6 Proxy, ~2.8 Kb |
| DOM binding | `reflectx` — directive-based, ~5.4 Kb |
| Routing | `routerx` — MPA/SPA, ~3.4 Kb |
| Markdown | `<re-md>` — web component, ~5.4 Kb |
| UI primitives | Custom Elements with shadow DOM and slots |
| Theming | CSS custom properties on `:root` |
| Loading orchestration | `autoDefine` + `waitForElementsReady` + `ready-element` |
| Loading overlays | `<monitor-element>` (verbose) or `<loader-element>` (minimal) |
| Build step | Optional — everything runs natively |
| Total framework overhead | 0 Kb |

---

*nativelayer — extend the platform. Do not replace it.*
