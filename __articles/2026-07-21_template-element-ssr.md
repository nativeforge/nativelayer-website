# Using the `<template>` Element for SSR

Server-side rendering usually means generating HTML strings and shipping them to the browser. The `<template>` element is rarely part of that story — which is a missed opportunity. On the server, templates are inert markup banks. In the HTML response, they define reusable DOM shapes without painting, fetching, or executing scripts. On the client, `cloneNode(true)` turns those shapes into interactive UI at the cost of a fragment copy, not a full re-parse.

This article is about that split: how to use `<template>` in SSR pipelines, where it pairs with Declarative Shadow DOM, and when it beats string concatenation or client-only frameworks.

## Why SSR Cares About `<template>`

Classic SSR problems:

- **Hydration mismatch** — server HTML differs from what client JS expects
- **Flash of unstyled content** — components render in light DOM before JS attaches shadow roots
- **Repeated markup** — lists and cards re-built in JS after HTML already arrived
- **Invalid nesting** — tables, SVG, and `<tr>` rows are painful to generate as strings

`<template>` addresses the last two directly and helps with the first two when combined with Declarative Shadow DOM.

| Concern | String SSR | `<template>` in shipped HTML |
|---|---|---|
| Scripts in markup | Must strip or guard | Inert until cloned |
| Image/media prefetch | Happens on parse | Deferred until clone |
| Table/SVG validity | Escape and nesting bugs | Valid fragment in template contents |
| Client reuse | Re-parse strings or fetch partials | Clone existing DOM prototype |

The server emits HTML the browser understands natively. JavaScript upgrades it instead of replacing it.

## Pattern 1: Template Banks in the SSR Shell

Ship a page skeleton with empty regions **and** a library of templates the client will clone:

```html
<main id="app">
  <ul id="notifications" aria-live="polite"></ul>
</main>

<template id="notification">
  <li class="notification" role="status">
    <span class="message"></span>
    <button type="button" class="dismiss">×</button>
  </li>
</template>
```

Server renders the static shell. API responses or SSE events drive client logic:

```js
const tpl = document.getElementById('notification');

function pushNotification(text) {
  const node = tpl.content.cloneNode(true);
  node.querySelector('.message').textContent = text;
  node.querySelector('.dismiss').addEventListener('click', () => {
    node.firstElementChild.remove();
  });
  document.getElementById('notifications').appendChild(node);
}
```

No client-side bundler required for the markup shape — it arrived in the first HTML document. SSR pays once; clones are cheap.

## Pattern 2: SSR List Rows Without String Templates

Generating table rows on the server as strings invites bugs:

```html
<!-- fragile string SSR -->
<tbody>
  <tr><td>Ada</td><td>92</td></tr>
</tbody>
```

Alternative: server renders **one** row template; initial data rows are server-rendered **or** hydrated from JSON:

```html
<template id="score-row">
  <tr>
    <td class="name"></td>
    <td class="score"></td>
  </tr>
</template>

<table>
  <tbody id="scores">
    <!-- Option A: server loops and clones template server-side into HTML -->
    <tr><td>Ada</td><td>92</td></tr>
    <tr><td>Lin</td><td>88</td></tr>
  </tbody>
</table>

<script type="application/json" id="scores-data">
  [{"name":"Ada","score":92},{"name":"Lin","score":88}]
</script>
```

On the client, if you need to re-render after navigation:

```js
const tpl = document.getElementById('score-row');
const data = JSON.parse(document.getElementById('scores-data').textContent);
const tbody = document.getElementById('scores');

tbody.replaceChildren(
  ...data.map(({ name, score }) => {
    const row = tpl.content.cloneNode(true);
    row.querySelector('.name').textContent = name;
    row.querySelector('.score').textContent = score;
    return row;
  })
);
```

The template guarantees every row has identical structure. SSR and client updates share one source of truth in the HTML.

## Pattern 3: Declarative Shadow DOM in SSR Output

The highest-impact SSR use of `<template>` today is **not** manual cloning — it is Declarative Shadow DOM (DSD):

```html
<product-card>
  <template shadowrootmode="open">
    <style>
      :host { display: block; border: 1px solid #ccc; padding: 1rem; }
      .price { font-weight: 700; }
    </style>
    <h2><slot name="title"></slot></h2>
    <p class="price"><slot name="price"></slot></p>
    <slot></slot>
  </template>
  <span slot="title">Mechanical Keyboard</span>
  <span slot="price">$149</span>
  <p>Hot-swappable switches, QMK/VIA.</p>
</product-card>
```

When this HTML arrives from the server:

1. The browser attaches an open shadow root at parse time
2. Styles apply immediately — no flash of unstyled light DOM
3. Slotted content from the server is visible before any JavaScript runs
4. When `customElements.define('product-card', …)` loads, the element **upgrades** in place

Your SSR pipeline outputs real component markup. `<template shadowrootmode="open">` is the SSR hook.

### Server-side generation of DSD

In Node, Deno, or edge workers, emit the same structure:

```js
function renderProductCard({ title, price, body }) {
  return `
<product-card>
  <template shadowrootmode="open">
    <style>:host{display:block;border:1px solid #ccc;padding:1rem}</style>
    <h2><slot name="title"></slot></h2>
    <p class="price"><slot name="price"></slot></p>
    <slot></slot>
  </template>
  <span slot="title">${escapeHtml(title)}</span>
  <span slot="price">${escapeHtml(price)}</span>
  ${body}
</product-card>`;
}
```

Tools like `@lit-labs/ssr`, `enhance`, and various Web Component frameworks automate this. The platform primitive is still `<template>` inside the host.

## Pattern 4: Islands — SSR Static, Hydrate Templates

"Islands" architecture: most HTML is static; small regions activate with JS.

```html
<article>
  <h1>Release notes</h1>
  <p>Shipped Tuesday.</p>
</article>

<!-- Inert until island boots -->
<template id="comment-form">
  <form class="comment-form">
    <textarea name="body" required></textarea>
    <button type="submit">Post</button>
  </form>
</template>

<div id="comments-mount"></div>
```

Client island:

```js
const mount = document.getElementById('comments-mount');
const form = document.getElementById('comment-form').content.cloneNode(true);
mount.appendChild(form);
form.querySelector('form').addEventListener('submit', onSubmit);
```

SSR never executed comment logic. The template sat inert in HTML — no layout cost, no stray form fields in the tab order until mounted.

## Pattern 5: Partial HTML Over the Wire

Some SSR setups stream HTML fragments. `<template>` can wrap each partial so the client inserts without `innerHTML`:

```html
<template id="stream-chunk-3">
  <section class="related">
    <h2>Related</h2>
    <ul>...</ul>
  </section>
</template>
```

```js
document.querySelector('#related-slot').append(
  document.getElementById('stream-chunk-3').content.cloneNode(true)
);
```

Compared to `innerHTML += chunk`:

- No HTML re-parse of a large string
- No script injection surface if chunks ever include user content
- Fragment moves in one insertion step

## What the Server Should and Should Not Emit

**Do emit:**

- `<template id="…">` with static structure
- `<template shadowrootmode="open">` inside custom element hosts
- `data-*` attributes on the `<template>` element as metadata (variant, locale, version)
- JSON `<script type="application/json">` siblings for initial state

**Do not emit inside template contents expecting SSR behavior:**

- `<script>` that must run at first paint (inert until cloned)
- `<link rel="stylesheet">` expecting load (won't load in template)
- `<img src="…">` expecting LCP contribution (won't fetch until active)
- Duplicate `id` values you rely on from `document.getElementById` (IDs in template contents are not in the document tree)

Always query template innards via `.content.querySelector`.

## SSR Framework Mapping

| Approach | How `<template>` fits |
|---|---|
| **MPA + progressive enhancement** | Template banks in layout; clone on interaction |
| **Web Components SSR** | DSD in HTML output; upgrade on define |
| **Lit SSR** | Generates shadow templates server-side |
| **Astro / partial hydration** | Static HTML + client islands clone templates |
| **HTMX / data swapping** | Optional: swap targets built from pre-declared templates |

You do not need a framework. A static site generator can write `<template>` nodes into every page layout once.

## Performance Notes

- **Clone cost** — `cloneNode(true)` is fast for small fragments; profile if templates are huge (full article bodies in one template is usually wrong)
- **Memory** — one template, many instances; cheaper than keeping parsed HTML strings in JS
- **First paint** — template contents do not block LCP; do not put hero images inside templates if they must paint immediately
- **Streaming** — templates at the end of `<body>` stream early shell, late UI library

## Testing SSR Output

1. **Disable JavaScript** — DSD content should still read correctly for static components
2. **View source** — confirm `<template shadowrootmode="open">` survived encoding
3. **Validate HTML** — template parsing contexts fix table/SVG nesting; run through a validator
4. **Hydration** — after `customElements.define`, shadow structure should not re-create (upgrade, not replace)

## When Not to Use `<template>` for SSR

- **Critical LCP image** — put `<img>` in normal document flow, not in template
- **SEO-only text** — search engines index document tree content; slotted light DOM in DSD is fine, but text trapped only in uncloned templates is invisible
- **Tiny one-off strings** — a single `<p>${text}</p>` does not need a template
- **Full-page HTML from SSR** — if the entire page is server-rendered live DOM, templates are for *reusable* fragments, not the whole document

## Checklist

1. Move reusable DOM shapes from JS strings into `<template id="…">` in the layout
2. Use DSD for Web Components that must render styled on first paint
3. Pair JSON state scripts with templates for client re-renders
4. Query via `.content`, never assume inner IDs are globally visible
5. Clone with `cloneNode(true)`; use `importNode` for cross-document templates
6. Keep templates inert; mount interactivity after clone

## Conclusion

For SSR, `<template>` is not a client-side convenience — it is a **contract between server HTML and client upgrades**. The server declares shape; the browser holds it inert until needed; JavaScript clones or shadow-attaches without reparsing strings.

If you already ship Web Components or islands, Declarative Shadow DOM is the headline feature. If you ship MPAs with sprinkles of JS, template banks are the zero-framework pattern hiding in plain sight.

The [general `<template>` deep dive](/demos/blog/post/?slug=html-template-element) covers parsing rules, nested libraries, and API details. This article is the SSR-shaped slice: emit templates in HTML, upgrade on the client, and stop rebuilding DOM from strings.

---

*Posted in* **FIELD NOTE** · *July 2026*
