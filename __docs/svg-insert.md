:: { style="width: 96px; height: auto;" }
![svg-insert logo](../__src/img/svg-insert-logo.svg)
::

# svg-insert

A zero-dependency Web Component that fetches an SVG file and inlines it directly into the DOM. The wrapper element is replaced by the raw `<svg>` node, giving the inserted graphic full access to CSS custom properties, `currentColor`, and your page's cascade — things that are impossible with `<img>` tags.

---

## Why svg-insert ?

`<img src="logo.svg">` renders an SVG as a replaced element. It is isolated from the page's CSS: `currentColor`, CSS custom properties, and inherited styles do not reach inside it. The only way to make an SVG respond to the page's theme or accent color is to inline it.

Inlining SVGs by hand is tedious and bloats your HTML. `svg-insert` does it at runtime:

- **Inherits CSS.** The inlined `<svg>` sits in the normal DOM, so `currentColor`, `fill: inherit`, and CSS variables all work.
- **Clean markup.** Write `<svg-insert src="/icons/logo.svg">` instead of pasting hundreds of SVG nodes by hand.
- **Attribute forwarding.** Pass `id`, `class`, `aria-label`, `viewBox`, or any attribute to the inserted `<svg>` via `svg-*` prefixed attributes on the wrapper. No JavaScript needed.
- **Optional wrapper.** By default the `<svg-insert>` element is replaced entirely. Add `keep-parent` to keep it as a container.
- **Dynamic.** Change `src` at runtime and the element re-fetches and re-injects automatically.
- **No build step.** Drop one `<script type="module">` in your HTML and it works.

---

## Installation

### Package managers

```bash
npm install @nativelayer.dev/svg-insert
```

```bash
pnpm add @nativelayer.dev/svg-insert
```

```bash
yarn add @nativelayer.dev/svg-insert
```

Then import and register:

```js
import svgInsert from '@nativelayer.dev/svg-insert'
customElements.define('svg-insert', svgInsert)
```

Or, using the auto-define helper included in the package:

```js
import '@nativelayer.dev/svg-insert/auto'
// <svg-insert> is now defined globally
```

### CDN

No install. Paste directly into HTML:

```html
<script type="module">
  import svgInsert from 'https://cdn.jsdelivr.net/npm/@nativelayer.dev/svg-insert/dist/svg-insert.esm.min.js'
  customElements.define('svg-insert', svgInsert)
</script>
```

Or using the auto-define build:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@nativelayer.dev/svg-insert/dist/svg-insert.auto.min.js"></script>
```

### Vendored dist files

If you prefer to self-host, download the dist file and reference it locally:

```html
<script type="module">
  import svgInsert from '/__src/components/svg-insert/index.js'
  customElements.define('svg-insert', svgInsert)
</script>
```

### Which format should I use

| Format | File | When to use |
|--------|------|-------------|
| **ESM** | `svg-insert.esm.min.js` | Modern HTML with `<script type="module">`, bundlers, Vite, Rollup |
| **CJS** | `svg-insert.cjs` | Node.js environments, older Webpack configs |
| **Auto** | `svg-insert.auto.min.js` | Drop-in: loads and self-registers with no configuration |

Use ESM for any modern project. The Auto build is the quickest way to get started.

---

## Usage

### Default: replace the wrapper

By default, `<svg-insert>` is completely replaced by the fetched `<svg>` element. The wrapper disappears from the DOM.

```html
<svg-insert src="/icons/logo.svg"></svg-insert>
```

Before (in source HTML):

```html
<svg-insert src="/icons/logo.svg"></svg-insert>
```

After (in live DOM):

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <!-- SVG content -->
</svg>
```

### Keep the wrapper with `keep-parent`

Add `keep-parent` if you need the `<svg-insert>` element to remain in the DOM as a container. This is useful when you need to style or position the wrapper independently.

```html
<svg-insert src="/icons/logo.svg" keep-parent></svg-insert>
```

After (in live DOM):

```html
<svg-insert keep-parent>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <!-- SVG content -->
  </svg>
</svg-insert>
```

### Forwarding attributes to the `<svg>` with `svg-*`

Any attribute on `<svg-insert>` that starts with `svg-` is automatically:

1. Stripped of the `svg-` prefix
2. Applied to the inserted `<svg>` element
3. Removed from the `<svg-insert>` wrapper

This lets you set `id`, `class`, `aria-label`, `role`, `style`, or any SVG presentation attribute declaratively from your HTML.

```html
<svg-insert
  src="/icons/arrow.svg"
  svg-id="nav-arrow"
  svg-class="icon icon--small"
  svg-aria-label="Navigate forward"
  svg-role="img"
></svg-insert>
```

After (in live DOM):

```html
<svg
  xmlns="http://www.w3.org/2000/svg"
  id="nav-arrow"
  class="icon icon--small"
  aria-label="Navigate forward"
  role="img"
>
  <!-- SVG content -->
</svg>
```

---

## Core API

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` | string | - | URL of the SVG file to fetch and inline. Changing this at runtime triggers a new fetch. |
| `keep-parent` | boolean | false | When present, the `<svg-insert>` wrapper is kept in the DOM and the `<svg>` is appended inside it. When absent, the wrapper is replaced entirely by the `<svg>`. |
| `svg-*` | string | - | Any attribute prefixed with `svg-` is forwarded to the inserted `<svg>` element with the prefix removed. See [Forwarding attributes](#forwarding-attributes-to-the-svg-with-svg-). |

### Observed attributes

`svg-insert` re-fetches and re-injects when `src` changes. All `svg-*` attributes are read and applied at fetch time, not observed individually after injection.

### DOM transform

The table below summarises the two rendering modes:

| Mode | `keep-parent` | Result in DOM |
|------|--------------|---------------|
| Replace (default) | absent | `<svg-insert>` is gone; `<svg>` is in its place |
| Container | present | `<svg-insert>` remains; `<svg>` is its only child |

---

## Examples

### Icon inheriting `currentColor`

Use `svg-class` to add a utility class that sets `fill: currentColor` on the SVG, so it picks up the text color of its context:

```html
<style>
  .icon { fill: currentColor; width: 1em; height: 1em; }
</style>

<button style="color: hsl(220 80% 55%);">
  <svg-insert src="/icons/star.svg" svg-class="icon"></svg-insert>
  Favourite
</button>
```

The inserted `<svg>` will have `class="icon"` and inherit the button's blue color through `currentColor`.

### Themed SVG with CSS custom properties

```html
<style>
  :root { --brand: hsl(260 70% 50%); }
  .brand-icon path { fill: var(--brand); }
</style>

<svg-insert src="/img/logo.svg" svg-class="brand-icon" keep-parent></svg-insert>
```

Because the SVG is inlined, `var(--brand)` resolves correctly inside it. This is impossible with `<img>`.

### Accessible SVG icon

```html
<svg-insert
  src="/icons/close.svg"
  svg-aria-label="Close dialog"
  svg-role="img"
  svg-focusable="false"
></svg-insert>
```

### Applying an inline style

```html
<svg-insert
  src="/img/hero-illustration.svg"
  svg-style="width: 100%; height: auto; display: block;"
  keep-parent
></svg-insert>
```

### Runtime `src` swap

Change `src` at any time and the element re-fetches automatically:

```html
<svg-insert id="icon" src="/icons/moon.svg"></svg-insert>

<button id="toggle">Toggle theme</button>

<script type="module">
  const icon = document.getElementById('icon')
  const btn  = document.getElementById('toggle')
  let dark = true

  btn.addEventListener('click', () => {
    dark = !dark
    icon.setAttribute('src', dark ? '/icons/moon.svg' : '/icons/sun.svg')
  })
</script>
```

> Note: after the first injection without `keep-parent`, the `<svg-insert>` element is no longer in the DOM. Keep a reference to it before injection, or use `keep-parent` when you need to swap `src` at runtime.

### Using `keep-parent` for layout control

```html
<style>
  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: hsl(220 100% 95%);
  }
  .icon-wrapper svg {
    width: 24px;
    height: 24px;
    fill: hsl(220 80% 45%);
  }
</style>

<svg-insert
  src="/icons/bell.svg"
  keep-parent
  class="icon-wrapper"
></svg-insert>
```

The wrapper is styled as a circular badge; the inner `<svg>` is sized and colored via the descendant selector.

---

## Edge cases

### `src` swap without `keep-parent`

Without `keep-parent`, the `<svg-insert>` element is removed from the DOM after the first injection — it is replaced by the raw `<svg>`. If you then change `src` on the now-detached element, `attributeChangedCallback` fires, `_fetchAndInject` runs, and `this.parentNode.replaceChild(...)` throws because `this.parentNode` is `null`.

```html
<!-- ❌ after injection, #icon is no longer in the DOM -->
<svg-insert id="icon" src="/icons/moon.svg"></svg-insert>

<script type="module">
  const icon = document.getElementById('icon') // reference captured before injection
  setTimeout(() => {
    icon.setAttribute('src', '/icons/sun.svg') // throws — parentNode is null
  }, 1000)
</script>
```

```html
<!-- ✅ use keep-parent when you need to swap src at runtime -->
<svg-insert id="icon" src="/icons/moon.svg" keep-parent></svg-insert>

<script type="module">
  const icon = document.getElementById('icon')
  setTimeout(() => {
    icon.setAttribute('src', '/icons/sun.svg') // safe — element stays in the DOM
  }, 1000)
</script>
```

---

### `src` not set

If `src` is absent, `_fetchAndInject` returns immediately and nothing happens. No error is thrown, no placeholder is injected. The `<svg-insert>` element simply remains empty.

```html
<!-- renders nothing, no error -->
<svg-insert></svg-insert>

<!-- renders normally once src is set -->
<svg-insert id="lazy"></svg-insert>
<script type="module">
  document.getElementById('lazy').setAttribute('src', '/icons/star.svg')
</script>
```

---

### SVG file returns a 404 or non-SVG response

If the server returns a 404 (or any non-ok response), the element logs a `[svg-insert] Failed to fetch SVG: Not Found` error to the console and leaves the DOM unchanged. The `<svg-insert>` element stays in place.

If the server returns HTML (e.g. a 404 page), `DOMParser` parses it as `image/svg+xml` and finds no `<svg>` element, which logs `[svg-insert] No <svg> element found in response`.

Both cases are non-breaking — the page continues to function, with the missing icon simply absent.

---

### Cross-origin SVGs

Fetching an SVG from a different origin requires the server to send a CORS `Access-Control-Allow-Origin` header. Without it, `fetch` throws a network error and the element logs it to the console.

```html
<!-- ❌ will fail if cdn.example.com does not send CORS headers -->
<svg-insert src="https://cdn.example.com/icons/logo.svg"></svg-insert>

<!-- ✅ self-host the SVG, or use a CDN that serves CORS headers (e.g. jsDelivr, unpkg) -->
<svg-insert src="https://cdn.jsdelivr.net/npm/your-icon-set/logo.svg"></svg-insert>
```

---

### Accessing `_svg` before the fetch completes

`_svg` is `null` until the async fetch resolves. Reading it synchronously after connecting the element will always return `null`.

```js
// ❌ fetch is async — _svg is still null here
const el = document.querySelector('svg-insert')
console.log(el._svg) // null

// ✅ wait for the element to fully render before reading _svg
// svg-insert dispatches no ready event, so use a MutationObserver or
// poll after a microtask if you need the reference
const observer = new MutationObserver(() => {
  const svg = el.querySelector('svg') ?? document.querySelector('svg[data-from-el]')
  if (svg) { observer.disconnect(); console.log(svg) }
})
observer.observe(el.parentNode, { childList: true })
```

---

### Multiple elements with the same `src`

Each `<svg-insert>` element fetches independently. If five elements share the same `src`, the browser makes five separate requests. The browser cache will typically serve subsequent requests from cache, but the initial burst happens regardless.

If you need many copies of the same icon, use `<use>` with a hidden symbol instead:

```html
<!-- define once, hidden -->
<svg style="display:none">
  <symbol id="icon-star" viewBox="0 0 24 24">
    <!-- paths -->
  </symbol>
</svg>

<!-- reuse many times, zero extra fetches -->
<svg><use href="#icon-star"></use></svg>
<svg><use href="#icon-star"></use></svg>
```

---

## Anti-patterns

### Swapping `src` on a replace-mode element

```html
<!-- ❌ element is gone after first inject — setAttribute throws on next tick -->
<svg-insert id="icon" src="/icons/a.svg"></svg-insert>
```

```html
<!-- ✅ always use keep-parent when src needs to change at runtime -->
<svg-insert id="icon" src="/icons/a.svg" keep-parent></svg-insert>
```

---

### Using `<img src="*.svg">` when you need CSS theming

```html
<!-- ❌ fill, currentColor, and CSS variables cannot reach inside an <img> SVG -->
<img src="/icons/logo.svg" style="color: var(--brand);">
```

```html
<!-- ✅ svg-insert inlines the SVG so the cascade reaches every node -->
<svg-insert src="/icons/logo.svg" svg-class="brand-icon"></svg-insert>
```

```css
.brand-icon path { fill: var(--brand); }
```

---

### Overriding `viewBox` dimensions with `svg-width` / `svg-height` without checking the source SVG

Forwarding fixed pixel dimensions onto a `<svg>` that has its own `viewBox` can distort or clip the graphic if the aspect ratios do not match.

```html
<!-- ❌ if the SVG is 24×24 but you force 100×32, it will be stretched or clipped -->
<svg-insert src="/icons/logo.svg" svg-width="100" svg-height="32"></svg-insert>
```

```html
<!-- ✅ size via CSS on the element instead, respecting the natural aspect ratio -->
<svg-insert src="/icons/logo.svg" svg-class="icon" keep-parent></svg-insert>
```

```css
.icon { width: 100px; height: auto; }
```

---

### No accessible label on a meaningful icon

```html
<!-- ❌ screen readers announce nothing useful -->
<svg-insert src="/icons/delete.svg"></svg-insert>
```

```html
<!-- ✅ add svg-aria-label and svg-role for meaningful icons -->
<svg-insert
  src="/icons/delete.svg"
  svg-aria-label="Delete item"
  svg-role="img"
></svg-insert>

<!-- ✅ for purely decorative icons, mark them as hidden -->
<svg-insert
  src="/icons/decorative-divider.svg"
  svg-aria-hidden="true"
></svg-insert>
```

---

### Pointing `src` at user-supplied input without validation

```js
// ❌ never pass unvalidated user input directly to src
const userInput = new URLSearchParams(location.search).get('icon')
document.querySelector('svg-insert').setAttribute('src', userInput)
// an attacker can point this at an SVG containing <script> or event handlers
```

```js
// ✅ allowlist known safe paths
const ALLOWED = ['/icons/moon.svg', '/icons/sun.svg', '/icons/star.svg']
const requested = new URLSearchParams(location.search).get('icon')
const safe = ALLOWED.includes(requested) ? requested : '/icons/default.svg'
document.querySelector('svg-insert').setAttribute('src', safe)
```

---

## Security

`svg-insert` fetches the SVG file via the browser's `fetch` API and injects the resulting markup via `appendChild` (or `replaceChild`). This means:

**SVG content is rendered as live DOM.** An SVG file can contain `<script>` tags, event handlers (`onclick`, `onload`), and `<foreignObject>` with arbitrary HTML. If you inline an SVG you do not control, you are executing whatever is inside it.

**Mitigations:**

1. **Only inline SVGs you own.** Do not point `src` at user-supplied URLs or third-party assets you have not reviewed.

2. **Validate server-side.** If `src` values can be influenced by user input (query strings, CMS fields), validate and allowlist them before rendering.

3. **CSP.** A `Content-Security-Policy` that disallows `unsafe-inline` scripts and restricts `script-src` will block injected `<script>` tags inside SVGs.

4. **Sanitize at the source.** Run untrusted SVG content through a sanitizer (e.g. [DOMPurify](https://github.com/cure53/DOMPurify) with `SVG_SAFE_FOR_HTML`) before serving it.

`svg-insert` does not sanitize SVG content by design. Sanitization is application-specific and belongs at the data layer.

---

## License

MIT License. Copyright (c) 2026 ynck-chrl.

See [LICENSE](../LICENSE) for the full text.
