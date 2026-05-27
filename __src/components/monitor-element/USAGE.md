# `<monitor-element>`

A self-contained, drop-in loading overlay for projects built with custom elements.

Place `<monitor-element>` in your HTML, point it at your app container, and it handles everything:

1. **Scans** the target container for all custom element tags
2. **Auto-imports** component files via [`autoDefine`](../../libs/autoDefine/USAGE.md)
3. **Waits** for every component to resolve its `ready` Promise via [`waitForElementsReady`](../../libs/waitForElementsReady/USAGE.md)
4. **Displays** each component's name and its time-to-ready in real time
5. **Sets a reveal attribute** on the app container (default: `ready`) — no inline styles
6. **Fades out** the overlay — then removes itself from the DOM

The page must provide CSS for the hidden/revealed states (see [Revealing the app](#revealing-the-app-required-page-css)).

---

## Quick start

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Required: hide app until loader sets reveal attribute (match selector to `app`) -->
  <style>
    main:not([ready]) {
      opacity: 0;
      transform: translateY(1rem);
    }
    main[ready] {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.4s ease, transform 0.4s ease;
    }
  </style>
  <script type="module" src="/monitor-element/index.js"></script>
</head>
<body>
  <!-- 1. Add the monitor — place it before your app content -->
  <monitor-element app="main" path="/components/"></monitor-element>

  <!-- 2. Your app — monitor sets `ready` on this when loading completes -->
  <main>
    <my-header></my-header>
    <my-card></my-card>
    <my-stats></my-stats>
  </main>
</body>
</html>
```

That's it. No other JavaScript is required on the page.

---

## Revealing the app (required page CSS)

`<monitor-element>` does **not** set inline styles on the app container. When loading finishes, it sets a **boolean attribute** on the element matched by `app` (default attribute name: **`ready`**).

Add styles on the page so content is hidden before that attribute appears, then animates in when it does. **Use the same selector as your `app` attribute** (`main`, `#app`, etc.).

```css
main:not([ready]) {
  opacity: 0;
  transform: translateY(1rem);
}
main[ready] {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
```

If `app="#app"`, use `#app:not([ready])` and `#app[ready]` instead of `main`.

Custom reveal attribute name (via `reveal-attribute` on `<monitor-element>`):

```css
#app:not([loaded]) { opacity: 0; }
#app[loaded] { opacity: 1; }
```

```html
<monitor-element app="#app" reveal-attribute="loaded"></monitor-element>
```

**Fixed headers:** `transform` on an ancestor breaks `position: fixed` for descendants. If the app container includes a fixed `<top-bar>`, either omit `transform` from the reveal CSS on that container, or wrap scrollable content in an inner element and point `app` at that wrapper instead.

**Overlay background:** `<monitor-element>` uses `hsla(var(--bcolor-hsl) / 1)` for its background. Make sure `--bcolor-hsl` is defined on `:root` before the element renders, otherwise the overlay will be transparent.

**No JavaScript:** add a `<noscript>` block so content stays visible when the loader does not run:

```html
<noscript>
  <style>main { opacity: 1; transform: translateY(0); }</style>
</noscript>
```

---

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `app` | `body` | CSS selector of the container to scan and reveal |
| `reveal-attribute` | `ready` | Attribute set on the `app` target when loading completes (empty string value) |
| `path` | `/components/` | Base path for locating component files (passed to `autoDefine`) |
| `naming` | `kebab` | Naming convention for component files (`pascal`, `camel`, `kebab`, `snake`) |
| `brand` | `@nativelayer.dev` | Brand name shown in the monitor header |
| `svg-icon-url` | `/__src/img/native-lines-logo.svg` | Path to an SVG file used as the brand icon. Fetched and inlined via `svg-ninja` so it inherits CSS variables (e.g. `--fcolor-hsl`) |
| `show-duration` | `800` | How long (ms) the overlay stays visible after all components are ready, before fading out |

### Examples

```html
<!-- Custom reveal attribute and brand icon -->
<monitor-element app="#root" reveal-attribute="loaded" path="/ui/" brand="Acme" svg-icon-url="/img/acme-logo.svg"></monitor-element>

<!-- Shorter overlay duration -->
<monitor-element app="main" path="/components/" show-duration="400"></monitor-element>

<!-- pascal naming override (e.g. MyHeader.js instead of my-header.js) -->
<monitor-element naming="pascal"></monitor-element>
```

---

## Theming

The overlay inherits your page's CSS custom properties automatically — no extra configuration needed if your page defines them:

| Property used | Role in the overlay |
|--------------|---------------------|
| `--bcolor-hsl` | Overlay background (`hsla(var(--bcolor-hsl) / 1)`) |
| `--fcolor-hsl` | Text, borders, inactive dot |
| `--accent-color-hsl` | Component tag (`<code>`) colour, ready-row tint |
| `--ff-2` | Body font family |
| `--ff-3` | Monospace font (component tags) |
| `--space-unit` | Spacing rhythm |
| `--base-radius` | Border-radius on card and icon |
| `--f-size-2`, `--f-size-p` | Font sizes |

Two overlay-specific properties can be overridden:

```css
monitor-element {
  --ls-green: #18d55d;   /* ready dot / time / footer colour */
  --ls-muted: #64748b;   /* inactive time / footer colour   */
}
```

---

## `monitor-done` event

When all components are ready, `<monitor-element>` dispatches a `monitor-done` CustomEvent that bubbles through the shadow boundary (`composed: true`). Use it to run post-load logic:

```js
document.addEventListener('monitor-done', (e) => {
  const { elapsed, components } = e.detail

  console.log(`All ready in ${elapsed}ms`)

  components.forEach(({ tag, time }) => {
    console.log(`  ${tag}: ${time}ms`)
  })
})
```

`e.detail` shape:

```ts
{
  elapsed: number           // total ms from start to all-ready
  components: Array<{
    tag:   string           // 'my-header'
    label: string           // '<my-header>'
    ready: boolean          // true
    time:  number | null    // 412
  }>
}
```

---

## Adjusting import paths for your project

`index.js` imports `autoDefine` and `waitForElementsReady` from relative paths that work within this repository. When copying `<monitor-element>` to another project, update the two import lines near the top of `index.js`:

```js
// ── readyElement core — adjust these two lines ──────────────────────────
import { autoDefine }           from '/__src/libs/autoDefine/index.js'
import { waitForElementsReady } from '/__src/libs/waitForElementsReady/index.js'
```

**Options:**

| Scenario | Import path |
|----------|-------------|
| Copy source files alongside component | `'./vendor/autoDefine.js'` |
| npm package (when published) | `'@ynck/ready-element/autoDefine'` |
| CDN (esm.sh, once published) | `'https://esm.sh/@ynck/ready-element/autoDefine'` |

`restate` and `reflectx` are imported from local lib paths in this repo. Adjust those too if you move the component to another project.

---

## Using with `ReadyElement` components

For the loader to track each component's timing, your custom elements must:

1. Extend `ReadyElement` (or manually dispatch a `ready` event)
2. Call `this._resolveReady()` when their async setup is complete

```js
import { readyElement } from '/__src/components/ready-element.js'

class MyHeader extends readyElement {
  async connectedCallback() {
    super.connectedCallback?.()
    await fetchConfig()
    this._resolveReady() // ← triggers the timing update in the loader
  }
}
customElements.define('my-header', MyHeader)
```

Components that do **not** extend `ReadyElement` are still waited for by `waitForElementsReady` via `customElements.whenDefined`, but they won't show individual timing in the loader.

---

## Without `autoDefine` — pre-registered components

If your components are already imported/registered before the page loads, set `path=""` (empty string) to skip the auto-import step. The loader will still wait for all ready signals:

```html
<monitor-element app="#app" path=""></monitor-element>
```

```js
// your bundle or inline script already defines the elements:
import './components/my-header.js'
import './components/my-card.js'
```

---

## Minimal self-contained HTML example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My App</title>

  <!-- Required: reveal styles for the app container -->
  <style>
    main:not([ready]) {
      opacity: 0;
      transform: translateY(1rem);
    }
    main[ready] {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.4s ease, transform 0.4s ease;
    }

    /* Optional: override ready-state colour */
    monitor-element {
      --ls-green: #18d55d;
    }
  </style>

  <!-- Register the loader -->
  <script type="module" src="/monitor-element/index.js"></script>
</head>
<body>

  <monitor-element
    app="main"
    path="/components/"
    brand="My App"
    svg-icon-url="/img/my-logo.svg"
  ></monitor-element>

  <main>
    <my-nav></my-nav>
    <my-hero></my-hero>
    <my-features></my-features>
  </main>

  <script>
    document.addEventListener('monitor-done', ({ detail }) => {
      console.log(`Loaded in ${detail.elapsed}ms`, detail.components)
    })
  </script>

</body>
</html>
```
