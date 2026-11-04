# `<re-theme>`

A floating, draggable developer panel for live-editing CSS custom properties. It scans your stylesheet for color variables, lets you tweak them with color pickers or raw text inputs, injects the overrides inline, and lets you copy, save, and reload named theme snapshots — all without a build step.

Built on [`restate`](../../libs/restate/) for state management and [`reflectx`](../../libs/reflectx/) for DOM binding.

---

## Usage

```html
<script type="module">
  import reTheme from '/__src/components/re-theme/re-theme.js'
  customElements.define('re-theme', reTheme)
</script>

<!-- Picks all color vars from :root -->
<re-theme pick-root></re-theme>

<!-- Scans a specific element's shadow :host color vars -->
<re-theme target-element="base-card"></re-theme>

<!-- Both at once -->
<re-theme pick-root target-element="my-widget"></re-theme>
```

---

## Attributes

| Attribute | Type | Description |
|---|---|---|
| `pick-root` | boolean | Scan all `:root` CSS custom properties for color values and load them into the panel |
| `target-element` | CSS selector | Also scan the matching element's shadow DOM `:host` color variables |

If neither attribute is present the panel shows an empty state with a hint.

---

## How it works

### 1. Color variable scanning

On `connectedCallback`, two scanners run depending on attributes:

**`scanCSSColorVars()` — `:root` vars**

Iterates every loaded stylesheet (skipping cross-origin sheets), collects all `--*` properties defined on `:root` or `html`, reads their computed value, and keeps only those whose value is a valid color or bare HSL component triplet (e.g. `250 5% 90%`).

**`scanTargetVars(el)` — shadow `:host` vars**

When `target-element` points to a custom element, the component waits for:
1. `customElements.whenDefined(tagName)` — element class registered
2. `el.ready` Promise (if present, via `readyElement` / `makeReady`) — element fully initialised

It then reads the element's shadow DOM stylesheets, collects all `--*` props on `:host` rules, and appends them to the variable list.

Both scanners produce entries shaped like:

```js
{
  name:        '--accent-color-hsl',
  rawValue:    '130 100% 50%',
  hex:         '#00ff00',
  isHSLParts:  true,     // bare "H S% L%" triplet, not a full CSS color
  modified:    false,
  disabled:    false,
  mappedTo:    null,
  source:      ':root' | ':host',
  original:    '130 100% 50%',
  originalHex: '#00ff00',
}
```

### 2. Color detection

Three helpers classify values:

- **`looksLikeColor(v)`** — accepts `#rrggbb`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, and named CSS colors (via `CSS.supports`)
- **`looksLikeHSLComponents(v)`** — detects bare triplets like `250 5% 90%` used as the inner value of `hsl(var(--name))` patterns
- **`colorToHex(v)`** — normalises any color to `#rrggbb` using a 1×1 canvas (browser color parsing)
- **`hexToHSL(hex)`** — converts `#rrggbb` back to `"H S% L%"` so that variables stored as HSL components stay valid after a color-picker edit

### 3. State

State is a [`restate`](../../libs/restate/) reactive proxy:

```js
const state = restate({
  vars:          [...],   // array of var entries
  copied:        false,
  minimized:     false,   // persisted in localStorage
  mapModalIdx:   null,    // index of var currently being mapped, or null
  savedThemes:   {},      // persisted in localStorage
  savePanelOpen: false,
  loadPanelOpen: false,
  themeSaved:    false,
})
```

Computed values (via `state.$computed`) derive labels, counts, and UI flags from state without storing duplicated data.

### 4. Override injection

**`doInject()`** builds a `<style id="re-theme-inject">` block from all modified, non-disabled variables and inserts it into:

- The target element's **shadow root** (if `target-element` was a custom element with a shadow root) — injected as `:host { ... }`
- The target element itself (if it has no shadow root) — injected as `:root { ... }`
- `document.head` (fallback when no `target-element`) — injected as `:root { ... }`

The injected block is created once and its `textContent` is updated on every change. It is removed when all overrides are reset.

**Why no `@layer`?**

CSS `@layer` only determines priority *between named layers*. Unlayered styles always beat every named layer regardless of source position. Since all nativelayer components and `global-styles.css` use **unlayered** CSS, wrapping the injection in a named layer would *lose* to the component's own styles.

Instead, injection relies on **source order**: the `<style id="re-theme-inject">` element is always `appendChild`-ed to the *end* of its container (shadow root or `document.head`), so it comes after the component's own stylesheet. For equal-specificity rules — `:host { … }` vs `:host { … }`, or `:root { … }` vs `:root { … }` — the last declaration wins. The injection wins.

The generated output looks like:

```css
:root {
  --accent-color-hsl: 220 100% 50%;
}
```

or, for shadow root injection:

```css
:host {
  --surface: #1a1a2e;
  --accent: hsl(0 100% 62%);
}
```

**If your project uses `@layer`**: wrap your own styles in `@layer base { … }`. The injection (unlayered, appended last) will then win as an unlayered override, which is guaranteed to beat all named layers.

### 5. Live editing

Two input types on each row interact through **delegated events** on the panel:

- **Color swatch** (`<input type="color">`) — native browser color picker. On change, the hex value is converted back to the variable's native format (`hexToHSL` for HSL component vars, raw hex for others) before being stored. `doInject()` is called immediately.
- **Raw text input** — accepts any valid CSS color or HSL triplet. The hex preview is re-derived from the typed value, then `doInject()` fires.

`syncInputs()` is called after every `reflectx` render to write current `hex`/`rawValue` back into the `<input>` elements (since they are not `x-bind`-able to native `value` without the reflectx `attr` directive, and focus state must be preserved).

### 6. Variable mapping

The **map-to** button (`→`) on each row opens a modal listing all variables in the panel. Selecting one sets the variable's `rawValue` to `var(--other-var)`, which is a valid CSS custom property reference. The mapped variable inherits the target's current hex swatch for display, but the injected value is the live CSS reference, not a fixed color.

Mapped variables show a highlighted `→` button. Resetting restores the original value and clears the mapping.

### 7. Theme save / load / delete

Themes are stored in `localStorage` under the key `re-theme-themes` as a JSON object mapping theme name to an array of `{ name, rawValue, hex }` entries — **only modified variables** are persisted.

- **SAVE** — opens an inline panel with a name input (Enter or SAVE button confirms)
- **LOAD** — opens a full-panel overlay listing saved themes; APPLY patches current vars, delete (✕) removes the entry
- **RESET ALL** — reverts all vars to their scanned originals and removes the injected style block

### 8. COPY

Clicking **COPY** writes the current `<style>` block text to the clipboard. This is the CSS you would paste into your own stylesheet to persist the edits permanently.

### 9. Drag and minimise

The header is a drag handle. Mouse and touch events move the panel freely within the viewport. Position is clamped so the panel never leaves the screen. On `mouseup` / `touchend` the position is saved to `localStorage` (`re-theme-pos`) and restored on next load before the first render.

The **MIN / MAX** button collapses the panel body via a CSS `max-height` transition. The minimised state is persisted under `re-theme-min`.

Event listeners are registered with an `AbortController` and torn down in `disconnectedCallback`.

---

## localStorage keys

| Key | Contents |
|---|---|
| `re-theme-min` | `"true"` or `"false"` — minimised state |
| `re-theme-pos` | `{"x": 120, "y": 24}` — panel position |
| `re-theme-themes` | `{ "name": [{name, rawValue, hex}, …] }` — saved themes |

---

## Internal architecture summary

```
<re-theme>
 └── Shadow DOM
      ├── Styles (self-contained, uses site --fcolor-hsl / --bcolor-hsl tokens)
      └── HTML (rendered by reflectx on every state.$onChange)
           ├── .header          drag handle + MIN/MAX + modified badge
           ├── .panel-body
           │    ├── .vars-list  one .var-row per variable
           │    ├── .empty      shown when no vars loaded
           │    ├── .footer     status + RESET ALL + COPY + SAVE + LOAD
           │    ├── .save-panel inline name input (x-if)
           │    ├── .load-panel full overlay (x-if)
           │    └── .map-modal  variable mapping overlay (x-if)
           └── (injected <style id="re-theme-inject"> in target or document.head)
```

State lives in a `restate` proxy → `state.$onChange` triggers `reflectx(state, shadowRoot)` → `syncInputs()` patches native `<input>` values that reflectx cannot bind directly.

---

## Dependencies

| Package | Role |
|---|---|
| `restate` | Reactive state proxy (`$computed`, `$methods`, `$onChange`, `$set`) |
| `reflectx` | Declarative DOM binding (`x-if`, `x-for`, `x-text`, `x-class`, `@click`) |
