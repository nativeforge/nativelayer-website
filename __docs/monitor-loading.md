:: { style="width: 96px; height: auto;" }
![monitor-loading logo](../__src/img/monitor-loading-logo.svg)
::

# monitor-loading

A single Custom Element that orchestrates the entire page-loading sequence — auto-importing components, patching them with the `readyElement` contract, waiting for every one to signal readiness, revealing the page, and then removing itself from the DOM. Zero JavaScript setup required: place it in `<head>`, and the page handles itself.

Two modes are available via one attribute toggle:

| Mode | Attribute | UI |
|------|-----------|----|
| Progress bar | _(none)_ | Minimal brand logo + animated progress bar |
| Monitor | `monitor` | Component list with status dots, patch badges, and per-component ready times |

---

## Why monitor-loading ?

Coordinating page reveal for a page with multiple async custom elements normally requires:

1. Importing every component manually
2. Registering each with `customElements.define`
3. Patching each to expose a `ready` Promise
4. Waiting for all of them with `waitForElementsReady`
5. Removing the overlay, applying the reveal class, and cleaning up

`monitor-loading` does all five steps automatically from a single element declaration. It is the recommended way to manage page reveal in any project that uses `nativelayer.dev` components.

---

## Installation

### Vendored dist file

```js
import monitorLoading from '/__src/components/monitor-loading/index.js'
customElements.define('monitor-loading', monitorLoading)
```

### In-page script

Place the `<script>` tag in `<head>` **before** any component in the target has a chance to connect. Then declare `<monitor-loading>` immediately after.

```html
<head>
  <script type="module">
    import monitorLoading from '/__src/components/monitor-loading/index.js'
    customElements.define('monitor-loading', monitorLoading)
  </script>

  <monitor-loading
    path="/__src/components/"
    brand="My App"
  ></monitor-loading>
</head>
<body>
  <site-header reveal></site-header>
  <main-content reveal></main-content>
</body>
```

---

## Usage

### Progress-bar mode (default)

Displays a brand logo and an animated horizontal progress bar. Each component that fires a `ready` event advances the bar by one step. The overlay fades out after all components are ready.

```html
<monitor-loading
  path="/__src/components/"
  brand="My App"
  show-duration="800"
  step-duration="600"
  overlay-fade="640"
></monitor-loading>
```

### Monitor mode

Displays a component list. Each row shows the tag name, a status dot (grey → green on ready), a `makeReady ✓` badge once patched, and the elapsed time in milliseconds. Useful during development.

```html
<monitor-loading
  monitor
  path="/__src/components/"
  brand="My App"
  show-duration="400"
></monitor-loading>
```

---

## How it works

1. Reads all attributes and writes `--show-duration-delay` to `:root` (`show-duration + overlay-fade` ms). Component reveal animations key off this variable.
2. Waits one microtask (`await Promise.resolve()`) so the full document has parsed.
3. Snapshots every hyphenated tag inside `target` (excludes itself to prevent deadlock).
4. Temporarily wraps `customElements.define` to call `makeReady(Ctor)` on every class before registering it — so every component gains a `ready` Promise automatically.
5. Calls `autoDefine({ root, path, caseConvention })` to dynamically import and define all components.
6. Restores the native `customElements.define`.
7. Calls `waitForElementsReady(target)` and awaits all `ready` Promises.
8. Sets `reveal-attribute` on `target`, dispatches the done event (`loader-done` or `monitor-done`).
9. Waits `show-duration` ms, adds the `.done` class, and removes itself on `transitionend`.

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `target` | string | `'body'` | CSS selector for the element to reveal |
| `path` | string | `'/__src/components/'` | Components directory passed to `autoDefine` |
| `case-convention` | string | `'kebab'` | Naming convention for `autoDefine` (`'pascal'`, `'camel'`, `'kebab'`, `'snake'`) |
| `brand` | string | `'@nativelayer.dev'` | Brand name shown in the overlay |
| `svg-icon-url` | string | `'/__src/img/native-lines-logo.svg'` | URL of the SVG used as the brand icon |
| `reveal-attribute` | string | `'ready'` | Attribute set on the target element when all components are ready |
| `show-duration` | number | `800` / `0` | Ms to keep overlay visible after all ready, before fade-out begins. Default is `800` in progress-bar mode and `0` in monitor mode. |
| `step-duration` | number | `800` | Progress bar CSS transition duration per step. Progress-bar mode only. |
| `overlay-fade` | number | `640` | Fade-out transition duration in ms |
| `monitor` | boolean | absent | When present, switches to verbose monitor mode |

---

## Events

Both events bubble and are composed. They carry the same `detail` shape:

```ts
{
  elapsed: number          // total ms from start to all-ready
  components: {
    tag:      string       // e.g. "site-header"
    label?:   string       // e.g. "<site-header>" — monitor mode only
    ready?:   boolean      // monitor mode only
    patched?: boolean      // monitor mode only
    time?:    number|null  // ms when ready, relative to start — monitor mode only
  }[]
}
```

### `loader-done` (progress-bar mode)

Fires when all components are ready in progress-bar mode.

```js
document.querySelector('monitor-loading')
  .addEventListener('loader-done', ({ detail }) => {
    console.log(`All ready in ${detail.elapsed}ms`)
    console.log(detail.components) // [{ tag: 'site-header' }, ...]
  })
```

### `monitor-done` (monitor mode)

Fires when all components are ready in monitor mode.

```js
document.querySelector('monitor-loading')
  .addEventListener('monitor-done', ({ detail }) => {
    console.log(`All ready in ${detail.elapsed}ms`)
    detail.components.forEach(c => {
      console.log(`${c.label} — ${c.time}ms, patched: ${c.patched}`)
    })
  })
```

---

## Component reveal with `[reveal]`

`monitor-loading` sets `--show-duration-delay` on `:root` to the sum of `show-duration` and `overlay-fade`. Add `reveal` to any component that should animate in only after the overlay has fully faded out.

```html
<site-header reveal></site-header>
<doc-quick   reveal></doc-quick>
```

```css
/* components wait for the overlay to clear before animating */
:is(site-header, doc-quick)[reveal]:not([ready]) {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.4s ease var(--show-duration-delay, 0ms),
              transform 0.4s ease var(--show-duration-delay, 0ms);
}

:is(site-header, doc-quick)[reveal][ready] {
  opacity: 1;
  transform: translateY(0);
}
```

The `[ready]` attribute is set on the component by `_resolveReady()` (via `makeReady`). No extra JavaScript needed.

---

## Examples

### Full page setup — progress-bar

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <script type="module">
    import monitorLoading from '/__src/components/monitor-loading/index.js'
    customElements.define('monitor-loading', monitorLoading)
  </script>

  <monitor-loading
    path="/__src/components/"
    brand="My App"
    show-duration="600"
    overlay-fade="500"
  ></monitor-loading>
</head>
<body>
  <site-header reveal></site-header>
  <hero-banner reveal></hero-banner>
  <site-footer reveal></site-footer>
</body>
</html>
```

### Full page setup — monitor mode

```html
<head>
  <script type="module">
    import monitorLoading from '/__src/components/monitor-loading/index.js'
    customElements.define('monitor-loading', monitorLoading)
  </script>

  <monitor-loading
    monitor
    path="/__src/components/"
    brand="Dev Build"
    show-duration="1200"
  ></monitor-loading>
</head>
```

### Custom target

Reveal only a specific section of the page:

```html
<monitor-loading
  target="#app"
  path="/__src/components/"
></monitor-loading>
```

```css
#app       { visibility: hidden; }
#app[ready] { visibility: visible; }
```

### Listening to the done event

```js
document.querySelector('monitor-loading')
  .addEventListener('loader-done', ({ detail }) => {
    console.log(`Page ready in ${detail.elapsed}ms`)
    // Start non-critical work after all components are ready
    initAnalytics()
    prefetchNextPage()
  }, { once: true })
```

### Custom brand icon

```html
<monitor-loading
  brand="Acme Corp"
  svg-icon-url="/assets/acme-logo.svg"
  path="/__src/components/"
></monitor-loading>
```

---

## CSS custom properties consumed

The overlay reads these properties from the page theme for its visual style. All have sensible fallbacks so the overlay works even without a design system.

| Property | Used for |
|----------|---------|
| `--bcolor-hsl` | Overlay background color |
| `--fcolor-hsl` | Text and border colors |
| `--accent-color-hsl` | Progress bar fill, component tag color |
| `--ff-2` | Brand name font family |
| `--ff-3` | Component tag monospace font |
| `--f-size-2` | Brand name font size |
| `--f-size-s` | Component tag font size |
| `--space-unit` | Spacing in monitor mode |
| `--base-radius` | List border radius in monitor mode |

---

## Companion tools

`monitor-loading` orchestrates three lower-level utilities internally. Use them directly when you need finer control than the element provides.

| Utility | Role |
|---------|------|
| [`autoDefine`](./autoDefine.md) | Scans the DOM and auto-imports + registers custom elements |
| [`makeReady`](./makeReady.md) | Injects the `ready` Promise contract into any component class |
| [`waitForElementsReady`](./waitForElementsReady.md) | Waits for all custom elements to resolve, then reveals the page |

---

## License

MIT License. Copyright (c) 2026 ynck-chrl.

See [LICENSE](../LICENSE) for the full text.
