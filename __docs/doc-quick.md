:: { style="width: 96px; height: auto;" }
![doc-quick logo](../__src/img/doc-quick-logo.svg)
::

# doc-quick

`< doc-quick >` is a `Custom Element` that allows to easily navigate a markdown file by formating it into a documentation browser.

Features of `< doc-quick >` :

- automatic markdown rendering (with re-md package from **nativelayer**)
- automatic sections and subsections generation from markdown file
- automatic sections and subsections listing
- automatic and optional sections and subsections automatic numbering
- automatic multipage documentation
- automatic bottom page navigation buttons with title generation from markdown file
- search feature with sections and subsections filtering
- default markdown rendering styles
- customizable markdown rendering styles

## Why doc-quick ?

`<doc-quick>` helps building documentation pages quickly from `markdown` files.

`<doc-quick>` is a Custom Element that contains 4 other components, each responsible for a particular feature in the context of a documentation page :

- `<doc-aside>`
- `<doc-body>`
- `<re-md>`
- `<doc-card>`

into a single element that you drop into a page. All navigation, chapter activation, theming, and scroll behaviour are handled internally. The host page only need to set attributes.

## Architecture

```bash
<doc-quick>                     ← orchestrator, owns all navigation state
  ├── <doc-aside>               ← fixed sidebar, built from re-md headings
  └── <doc-body>
        ├── <re-md>             ← fetches + renders the markdown source
        └── <div>
              ├── <doc-card data-label="previous">
              └── <doc-card data-label="next">
```

All child components are registered by `doc-quick` itself via an idempotent `define()` helper — no separate registration needed for `re-md`, `doc-aside`, `doc-body` or `doc-card`.

### Dependencies

- `<doc-aside>`
- `<doc-body>`
- `<re-md>`
- `<doc-card>`

## Basic usage

Register `doc-quick` in the page `<head>`, then place the element in `<body>`. Components used by the page but not orchestrated by `doc-quick` (e.g. `<top-bar>`) are registered separately.

```html
<head>
  <script type="module">
    import topBar from "/__src/components/top-bar.js"
    customElements.define('top-bar', topBar)
  </script>

  <script type="module">
    import docQuick from "/__src/components/doc-quick.js"
    customElements.define('doc-quick', docQuick)
  </script>
</head>

<body>
  <top-bar></top-bar>
  <doc-quick
    src="/path/to/document.md"
    chapter-mode
    syntax-css="/__src/css/code-syntax.css"
    expander-color="hsl(var(--accent-color-hsl))"
    section-numbers
  ></doc-quick>
</body>
```

## Attributes

| Attribute | Type | Description |
|---|---|---|
| `src` | `string` | Markdown URL. Forwarded to the internal `<re-md>`. |
| `hash` | `string` | Heading or chapter ID to activate and scroll to (e.g. `2-api-reference`). Set by the router on navigation. |
| `chapter-mode` | `boolean` | Enables chapter-mode layout. Forwarded to `<re-md>`. In this mode the document is split into `<section>` elements, one per `h2`. |
| `syntax-css` | `string` | CSS URL for syntax highlighting. Forwarded to `<re-md>`. |
| `hljs-src` | `string` | URL to load `highlight.js` from. Forwarded to `<re-md>`. Only fetched when the markdown contains at least one code block. Defaults to `https://esm.sh/highlight.js` when omitted. |
| `theme-color-hsl` | `string` | HSL string (e.g. `"210 80% 55%"`) applied as `--accent-color-hsl` on `<html>`. Also computes `--accent-color-hsl-adjusted` and sets `--accent-is-light` / `--accent-is-dark` classes. |
| `expander-color` | `string` | Any CSS colour value for the `▶` expand icons in `<doc-aside>`. |
| `section-numbers` | `boolean` | Shows numbered section counters in `<doc-aside>`. |

## How navigation works

All navigation flows through a single delegated `click` listener on `<doc-quick>` itself. It uses `e.composedPath()` to see through shadow DOM boundaries and identifies two kinds of targets:

1. **Anchor links** — any `<a href="#…">` anywhere inside the tree (including inside `<doc-card>`'s shadow root and `<doc-aside>`)
2. **Heading clicks** — any `<h1>`–`<h6>` with an `id` inside `<doc-body>` / `<re-md>`

When either is found, the listener calls `_navigate(hash)`:

```bash
click → composedPath() → _navigate(hash)
           │
           ├── window.history.pushState(…, '#' + hash)
           └── setAttribute('hash', hash)
                    │
                    └── attributeChangedCallback('hash')
                              │
                              └── _activateChapterWhenReady(hash)
                                        │
                                        ├── _activateChapter(hash)   ← marks section + sidebar item
                                        └── _scrollTo(hash)          ← scrolls to heading or top
```

Because `hash` is the single source of truth, the router only needs to do:

```js
docQuick.setAttribute('src',  '/path/to/doc.md')
docQuick.setAttribute('hash', '2-api-reference')
```

## Chapter activation

`_activateChapter(hash)` does three things synchronously:

1. Finds the matching `<section ref="…">` inside `re-md`'s rendered output (by `ref` attribute or by `document.getElementById` on the heading)
2. Removes `--chapter-active` from all sibling sections and adds it to the matched one
3. Calls `docAside.activateNavItem(hash)` to highlight the corresponding sidebar entry and open its parent group

If the `re-md` content is not yet rendered when the hash changes (async fetch), `_activateChapterWhenReady` installs a `MutationObserver` on `<re-md>` and retries on every DOM change. The observer self-disconnects on the first successful activation. A 5-second safety timeout prevents indefinite observation when a hash points to a heading that does not exist in the document.

## Scroll behaviour

`_scrollTo(hash)` resolves where to scroll:

- If `document.getElementById(hash)` finds an element → uses `scrollToHeadingElement()` (accounts for `--top-bar-height` + `--space-unit * 4` offset)
- Otherwise (synthetic chapter keys like `0-introduction` have no element with that `id`) → `window.scrollTo({ top: 0 })` to reach the very top of the first section

## Theme application

When `theme-color-hsl` is set, `_applyTheme` computes the perceived luminance of the colour and:

- Sets `--accent-color-hsl` on `<html>`
- Sets `--accent-color-hsl-adjusted` (contrast-safe variant)
- Adds `--accent-is-light` if luminance > 0.6, `--accent-is-dark` if luminance < 0.1, or removes both otherwise

This lets CSS rules react to the accent brightness (e.g. ensuring sidebar icon colours remain readable on a light accent background).

## Integration with router.js

`router.js` treats `<doc-quick>` as a dumb attribute sink. A minimal route handler looks like:

```js
router.on('/docs/:product', async (params) => {
  const docQuick = document.querySelector('doc-quick')
  const { src, hash, themeColorHsl } = await fetchProductMeta(params.product)

  docQuick.setAttribute('src', src)
  docQuick.setAttribute('theme-color-hsl', themeColorHsl)
  docQuick.setAttribute('hash', hash || '0-introduction')
})

router.onHashChange((hash) => {
  const docQuick = document.querySelector('doc-quick')
  if (docQuick) docQuick.setAttribute('hash', hash)
})
```

No direct manipulation of `<doc-aside>`, `<doc-body>`, or `<re-md>` is needed in the router.

## Component responsibilities (separation of concerns)

| Component | Responsibility |
|---|---|
| `<doc-quick>` | Orchestration: navigation events, chapter activation, theming, attribute forwarding |
| `<re-md>` | Fetches and renders markdown; emits DOM containing `<section>` elements in chapter mode |
| `<doc-body>` | Layout wrapper; owns `chapterMap` and `chapterIndex`; dispatches `chapter-change` events; provides `copyToClipboard` |
| `<doc-aside>` | Fixed sidebar; builds nav tree from `<doc-body>` headings; `activateNavItem(hash)` is called by `doc-quick` |
| `<doc-card>` | Previous/next navigation buttons; their `<a>` links bubble up to `doc-quick`'s delegated click listener |

## CSS variables expected in the host page

`<doc-quick>` does not manage layout CSS itself. The page must define:

```css
:root {
  --doc-aside-width: 16rem;   /* width of the fixed sidebar */
  --top-bar-height: 3rem;     /* used for sticky offset calculations */
  --page-padding-x: 1rem;     /* horizontal padding inside sidebar and body */
  --space-unit: 0.5rem;       /* base spacing unit */
}
```

## License

`doc-quick` is licensed under the **PolyForm Noncommercial License 1.0.0** for non-commercial use, with a commercial license option available.

### Non-Commercial Use

`doc-quick` is free under the **PolyForm Noncommercial License** for:

- ✓ Open-source projects (OSI-approved licenses)
- ✓ Personal projects and non-revenue generating applications
- ✓ Educational purposes and academic research
- ✓ Non-profit organizations
- ✓ Internal company tools (non-revenue generating)
- ✓ Prototypes and MVPs

See [LICENSE](./LICENSE) for full details.

### Commercial Use

A **commercial license** is required for:

- Proprietary software and closed-source commercial applications
- SaaS products and revenue-generating applications
- Enterprise deployments and large-scale corporate use
- White-label products sold or licensed to third parties

**Commercial licenses include:**

- Legal protection and indemnification
- Priority support
- Updates and bug fixes during license term
- Custom licensing terms for enterprise needs

### Licensing Inquiries

**For commercial licensing, pricing, or questions:**

::base-button {class="--light" target="_blank" href="/licenses#doc-quick" style="padding: calc(var(--space-unit)* 3) 0"}
View doc-quick licensing & pricing
::

- **Email:** info@nativelayer.dev
