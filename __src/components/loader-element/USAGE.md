# `<loader-element>`

A minimal, drop-in progress-bar loading overlay for projects built with custom elements.

Place `<loader-element>` in your HTML, point it at your app container, and it handles everything:

1. **Scans** the target container for all custom element tags
2. **Auto-imports** component files via [`autoDefine`](../../libs/autoDefine/USAGE.md)
3. **Waits** for every component to resolve its `ready` Promise via [`waitForElementsReady`](../../libs/waitForElementsReady/USAGE.md)
4. **Animates** a progress bar — one step per component that becomes ready
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
    main:not([ready]) { opacity: 0; }
    main[ready]       { opacity: 1; transition: opacity 0.4s ease; }
  </style>
  <script type="module">
    import loaderElement from '/loader-element/index.js'
    customElements.define('loader-element', loaderElement)
  </script>
</head>
<body>
  <!-- 1. Add the loader — place it before your app content -->
  <loader-element app="main" path="/components/"></loader-element>

  <!-- 2. Your app — loader sets `ready` on this when loading completes -->
  <main>
    <my-header></my-header>
    <my-card></my-card>
    <my-stats></my-stats>
  </main>

  <noscript>
    <style>main { opacity: 1; }</style>
  </noscript>
</body>
</html>
```

---

## Revealing the app (required page CSS)

`<loader-element>` does **not** set inline styles on the app container. When loading finishes, it sets a **boolean attribute** on the element matched by `app` (default: **`ready`**).

Add styles on the page so content is hidden before that attribute appears, then animates in when it does. **Use the same selector as your `app` attribute** (`main`, `#app`, etc.).

```css
main:not([ready]) { opacity: 0; }
main[ready]       { opacity: 1; transition: opacity 0.4s ease; }
```

Custom reveal attribute name (via `reveal-attribute` on `<loader-element>`):

```css
#app:not([loaded]) { opacity: 0; }
#app[loaded]       { opacity: 1; transition: opacity 0.4s ease; }
```

```html
<loader-element app="#app" reveal-attribute="loaded"></loader-element>
```

**Fixed headers:** `transform` on an ancestor breaks `position: fixed` for descendants. If the app container includes a fixed `<top-bar>`, omit `transform` from the reveal CSS on that container.

**Overlay background:** `<loader-element>` uses `hsla(var(--bcolor-hsl) / 1)` for its background. Make sure `--bcolor-hsl` is defined on `:root` before the element renders, otherwise the overlay will be transparent.

**No JavaScript:** add a `<noscript>` block so content stays visible when the loader does not run:

```html
<noscript>
  <style>main { opacity: 1; }</style>
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
| `brand` | `@nativelayer.dev` | Brand name shown above the progress bar |
| `svg-icon-url` | `/__src/img/native-lines-logo.svg` | Path to an SVG file used as the brand icon. Fetched and inlined via `svg-ninja` so it inherits CSS variables (e.g. `--fcolor-hsl`) |
| `show-duration` | `800` | How long (ms) the overlay stays visible after reaching 100%, before fading out |
| `step-duration` | `800` | CSS transition duration (ms) per progress step — controls how smoothly the bar fills |

### Examples

```html
<!-- Custom reveal attribute and brand icon -->
<loader-element app="#root" reveal-attribute="loaded" path="/ui/" brand="Acme" svg-icon-url="/img/acme-logo.svg"></loader-element>

<!-- Faster animation -->
<loader-element app="main" path="/components/" step-duration="400" show-duration="400"></loader-element>

<!-- pascal naming override (e.g. MyHeader.js instead of my-header.js) -->
<loader-element naming="pascal"></loader-element>
```

---

## Theming

The overlay inherits your page's CSS custom properties automatically:

| Property used | Role in the overlay |
|--------------|---------------------|
| `--bcolor-hsl` | Overlay background (`hsla(var(--bcolor-hsl) / 1)`) |
| `--fcolor-hsl` | Text, track background |
| `--ff-2` | Body font family |
| `--f-size-2` | Brand name font size |

One overlay-specific property can be overridden:

```css
loader-element {
  --ls-green: #18d55d;   /* progress bar fill colour */
}
```

---

## `loader-done` event

When all components are ready, `<loader-element>` dispatches a `loader-done` CustomEvent that bubbles through the shadow boundary (`composed: true`). Use it to run post-load logic:

```js
document.addEventListener('loader-done', (e) => {
  const { elapsed, components } = e.detail
  console.log(`All ready in ${elapsed}ms`)
  components.forEach(({ tag }) => console.log(` • ${tag}`))
})
```

`e.detail` shape:

```ts
{
  elapsed:    number            // total ms from start to all-ready
  components: Array<{
    tag: string                 // 'my-header'
  }>
}
```

---

## Adjusting import paths for your project

`index.js` imports `autoDefine` and `waitForElementsReady` from paths that work within this repository. Update them when copying to another project:

```js
import { autoDefine }           from '/__src/libs/autoDefine/index.js'
import { waitForElementsReady } from '/__src/libs/waitForElementsReady/index.js'
```

| Scenario | Import path |
|----------|-------------|
| Copy source files alongside component | `'./vendor/autoDefine.js'` |
| npm package (when published) | `'@ynck/ready-element/autoDefine'` |
| CDN (esm.sh, once published) | `'https://esm.sh/@ynck/ready-element/autoDefine'` |

---

## Using with `ReadyElement` components

For the loader to advance the bar per-component, your custom elements must dispatch a `ready` event. The easiest way:

1. Extend `ReadyElement`
2. Call `this._resolveReady()` when async setup is complete

```js
import { readyElement } from '/__src/components/ready-element.js'

class MyHeader extends readyElement {
  async connectedCallback() {
    super.connectedCallback?.()
    await fetchConfig()
    this._resolveReady() // ← advances the progress bar
  }
}
customElements.define('my-header', MyHeader)
```

Components that do **not** extend `ReadyElement` are still waited for via `customElements.whenDefined`, but they won't advance the bar — the bar jumps to 100% when `waitForElementsReady` resolves.

---

## Without `autoDefine` — pre-registered components

If your components are already imported before the page loads, set `path=""` to skip the auto-import step:

```html
<loader-element app="#app" path=""></loader-element>
```

```js
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

  <style>
    main:not([ready]) { opacity: 0; }
    main[ready]       { opacity: 1; transition: opacity 0.4s ease; }

    /* Optional: override bar colour */
    loader-element { --ls-green: #18d55d; }
  </style>

  <script type="module">
    import loaderElement from '/loader-element/index.js'
    customElements.define('loader-element', loaderElement)
  </script>
</head>
<body>

  <loader-element
    app="main"
    path="/components/"
    brand="My App"
    svg-icon-url="/img/my-logo.svg"
    step-duration="600"
    show-duration="400"
  ></loader-element>

  <main>
    <my-nav></my-nav>
    <my-hero></my-hero>
    <my-features></my-features>
  </main>

  <noscript><style>main { opacity: 1; }</style></noscript>

  <script>
    document.addEventListener('loader-done', ({ detail }) => {
      console.log(`Loaded in ${detail.elapsed}ms`, detail.components)
    })
  </script>

</body>
</html>
```
