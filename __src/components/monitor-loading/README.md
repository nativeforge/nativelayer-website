# monitor-loading

A unified loading overlay Custom Element that orchestrates page reveal. It auto-imports and defines all custom elements found in the target, patches each with the `readyElement` lifecycle contract via `makeReady`, waits for every component to signal readiness, then reveals the page and removes itself.

Two modes are available via a single attribute toggle:

| Mode | Attribute | UI |
|------|-----------|----|
| Progress bar | _(none)_ | Minimal brand + animated progress bar |
| Monitor | `monitor` | Component list with status dots, ready times, and patch badges |

---

## Registration

```html
<script type="module">
  import monitorLoading from '/__src/components/monitor-loading/index.js'
  customElements.define('monitor-loading', monitorLoading)
</script>
```

Place the element in `<head>` before `<body>` so it is active before any component in the target has connected.

---

## Progress-bar mode

Minimal overlay with a brand logo and a single progress bar. Each component that fires a `ready` event advances the bar by one step.

```html
<monitor-loading
  target="body"
  path="/__src/components/"
  brand="My App"
  show-duration="800"
  step-duration="600"
  overlay-fade="640"
></monitor-loading>
```

**Event fired when done:** `loader-done`

---

## Monitor mode

Verbose overlay showing each discovered component as a list row. Each row displays the tag name, a status dot (grey until ready, green when ready), a `makeReady ✓` badge once patched, and the elapsed time in milliseconds.

```html
<monitor-loading
  monitor
  target="body"
  path="/__src/components/"
  brand="My App"
  show-duration="400"
  overlay-fade="640"
></monitor-loading>
```

**Event fired when done:** `monitor-done`

---

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `target` | string | `'body'` | CSS selector for the element to reveal |
| `path` | string | `'/__src/components/'` | Components directory passed to `autoDefine` |
| `case-convention` | string | `'kebab'` | Case convention passed to `autoDefine` (`'pascal'`, `'camel'`, `'kebab'`, `'snake'`) |
| `include` | string | — | Space-separated tag names or `prefix*` patterns passed to `autoDefine` `include`. Only matching elements are imported, listed, and waited on. |
| `exclude` | string | — | Space-separated tag names or `prefix*` patterns passed to `autoDefine` `exclude`. Applied after `include`. |
| `brand` | string | `'@nativelayer.dev'` | Brand name shown in the overlay |
| `svg-icon-url` | string | `'/__src/img/native-lines-logo.svg'` | URL of the brand icon SVG |
| `reveal-attribute` | string | `'ready'` | Attribute set on the target element when done |
| `show-duration` | number | `800` / `0` | Ms to keep overlay visible after all ready (default differs by mode) |
| `step-duration` | number | `800` | Progress bar CSS transition duration per step. Progress-bar mode only. |
| `overlay-fade` | number | `640` | Fade-out transition duration in ms |
| `monitor` | boolean | false | Enables verbose component-list mode |

Patterns follow `autoDefine`: an exact tag name (`base-card`) or a prefix ending in `*` (`base-*`). Omit the attribute to keep every tag. A present but empty `include` selects nothing.

```html
<monitor-loading
  target="body"
  include="base-* top-bar"
  exclude="base-icon"
></monitor-loading>
```

---

## Events

Both events carry the same shape in `event.detail`:

```ts
{
  elapsed: number                  // total ms from start to all-ready
  components: {
    tag:     string                // e.g. "top-bar"
    label?:  string                // e.g. "<top-bar>" — monitor mode only
    ready?:  boolean               // monitor mode only
    patched?: boolean              // monitor mode only
    time?:   number | null         // ms when ready — monitor mode only
  }[]
}
```

### `loader-done` (progress-bar mode)

```js
document.querySelector('monitor-loading')
  .addEventListener('loader-done', ({ detail }) => {
    console.log(`Ready in ${detail.elapsed}ms`)
    console.log(detail.components) // [{ tag: 'top-bar' }, ...]
  })
```

### `monitor-done` (monitor mode)

```js
document.querySelector('monitor-loading')
  .addEventListener('monitor-done', ({ detail }) => {
    console.log(`Ready in ${detail.elapsed}ms`)
    detail.components.forEach(c => {
      console.log(`${c.label} — ready: ${c.ready}, patched: ${c.patched}, time: ${c.time}ms`)
    })
  })
```

---

## Page reveal with CSS

`monitor-loading` sets the CSS variable `--show-duration-delay` on `:root` to `show-duration + overlay-fade` milliseconds. This delays the reveal animation of components that use `[reveal]` so they begin animating only after the overlay has fully faded out.

Add `reveal` to any top-level component you want to animate in:

```html
<top-bar reveal></top-bar>
<doc-quick reveal></doc-quick>
```

The global CSS rule in `global-styles.css` drives the animation:

```css
:is(top-bar, doc-quick, ...)[reveal]:not([ready]) {
  opacity: 0;
  transform: translateY(16px);
  transition-delay: var(--show-duration-delay, 0ms);
}

:is(top-bar, doc-quick, ...)[reveal][ready] {
  opacity: 1;
  transform: translateY(0);
  transition-delay: var(--show-duration-delay, 0ms);
}
```

---

## How it works

1. On `connectedCallback`, reads all attributes and sets `--show-duration-delay` on `:root`.
2. Waits one microtask (`await Promise.resolve()`) so the full document has parsed.
3. Snapshots custom element tags inside `target` that match `include` / `exclude` (excludes itself to prevent deadlock).
4. Temporarily replaces `customElements.define` with a wrapper that calls `makeReady(Ctor)` on every class before registering it.
5. Calls `autoDefine({ root, path, caseConvention, include, exclude })` to dynamically import and define the selected components.
6. Restores the native `customElements.define`.
7. Moves custom elements that miss the filter out of `target`, calls `waitForElementsReady(target)`, then puts those elements back. `waitForElementsReady` itself is unchanged.
8. Sets `reveal-attribute` on `target`, removes any inline `style`, dispatches the done event.
9. Waits `show-duration` ms, then adds the `.done` class which triggers the CSS fade-out.
10. Removes itself from the DOM on `transitionend`.

---

## CSS custom properties consumed

| Property | Set by | Used for |
|----------|--------|----------|
| `--bcolor-hsl` | page theme | overlay background color |
| `--fcolor-hsl` | page theme | text and border colors |
| `--accent-color-hsl` | page theme | progress bar fill and code color |
| `--ff-2` | page theme | brand name font |
| `--ff-3` | page theme | component tag monospace font |
| `--f-size-2` | page theme | brand name font size |
| `--f-size-s` | page theme | tag name font size |
| `--space-unit` | page theme | spacing in monitor mode |
| `--base-radius` | page theme | list border radius |
| `--show-duration-delay` | set by this element | component reveal animation delay |
