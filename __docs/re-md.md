:: { style="width: 96px; height: auto;" }
![re-md logo](../__src/img/remd-logo.svg)
::

# re-md

![npm version](https://img.shields.io/npm/v/@nativelayer.dev/ready-element)
![bundle size](https://img.shields.io/bundlephobia/minzip/@nativelayer.dev/ready-element)
![license](https://img.shields.io/github/license/nativeforge/ready-element)
![last commit](https://img.shields.io/github/last-commit/nativeforge/ready-element)

A markdown Web Component with no install-time dependencies. Syntax highlighting is loaded on-demand only when your markdown contains at least one code block — from CDN by default, or from a custom URL via the `hljs-src` attribute.

`re-md` is a single Custom Element. It has no runtime dependencies beyond [highlight.js](https://highlightjs.org) (loaded on demand from a CDN) and does not require a build step, a bundler, or a framework.

---

## Why re-md ?

Most markdown rendering happens at build time or on a server. That is fine for static sites, but it means the browser never sees a markdown renderer — it sees generated HTML that cannot be composed, updated, or re-rendered on the client without rebuilding.

`re-md` renders at runtime, in the browser, using Custom Elements. This means:

- **No build step required.** Drop a `<re-md>` tag in HTML and it just works.
- **Dynamic.** Change `src` at runtime and the element re-fetches and re-renders automatically.
- **Composable.** Use the `transform` attribute to map markdown elements to any HTML element or custom element — including ones you define yourself.
- **Framework-agnostic.** Works in React, Vue, Svelte, Astro, or plain HTML equally, because it is a browser primitive.
- **Progressive.** If JavaScript fails, the raw markdown text is still in the DOM. No blank page.

---

## Installation

### Package managers

```bash
npm install @nativelayer.dev/re-md
```

```bash
pnpm add @nativelayer.dev/re-md
```

```bash
yarn add @nativelayer.dev/re-md
```

Then import and register:

```js
import remd from '@nativelayer.dev/re-md'
customElements.define('re-md', remd)
```

Or, using the auto-define helper included in the package:

```js
import '@nativelayer.dev/re-md/auto'
// <re-md> is now defined globally
```

### CDN

No install. Paste directly into HTML:

```html
<script type="module">
  import remd from 'https://cdn.jsdelivr.net/npm/@nativelayer.dev/re-md/dist/re-md.esm.min.js'
  customElements.define('re-md', remd)
</script>
```

Or using the auto-define build:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@nativelayer.dev/re-md/dist/re-md.auto.min.js"></script>
```

### Vendored dist files

If you prefer to self-host, download the dist files and reference them locally:

```html
<script type="module">
  import remd from '/__src/libs/re-md/re-md.esm.min.js'
  customElements.define('re-md', remd)
</script>
```

### Which format should I use

| Format | File | When to use |
|--------|------|-------------|
| **ESM** | `re-md.esm.min.js` | Modern HTML with `<script type="module">`, bundlers, Vite, Rollup |
| **CJS** | `re-md.cjs` | Node.js environments, older Webpack configs, Jest |
| **Auto** | `re-md.auto.min.js` | Drop-in: loads and self-registers with no configuration |

Use ESM for any modern project. Use CJS only in Node.js tooling contexts (testing, SSR). The Auto build is the quickest way to get started.

> `re-md` requires a DOM environment. In Node.js, pair it with [jsdom](https://github.com/jsdom/jsdom) or [happy-dom](https://github.com/capricorn86/happy-dom).

---

## Usage

### External file

Fetch and render a markdown file:

```html
<re-md src="/docs/guide.md"></re-md>
```

The element fetches the file, renders it to HTML, and replaces its own content. If `src` changes at runtime, the element re-fetches automatically.

### Inline content

Write markdown directly inside the tag:

```html
<re-md>
  # Hello world

  This is **inline markdown** with `code`.

  - item one
  - item two
</re-md>
```

Leading whitespace is normalized automatically, so indented inline markdown works as expected inside templates or components.

### With a transform

Map markdown elements to custom HTML elements:

```html
<re-md src="/docs/api.md" transform="(h1: doc-title, codeblock: doc-code {theme='dark'})"></re-md>
```

### With syntax theme and chapter mode

```html
<re-md
  src="/docs/reference.md"
  syntax-css="/css/code-syntax.css"
  chapter-mode
></re-md>
```

---

## Core API

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` | string | — | URL of the markdown file to fetch and render |
| `transform` | string | — | Rules mapping markdown elements to HTML elements (see Transform rules) |
| `chapter-mode` | boolean | false | Split content into sections by `h2`; only the active section is visible |
| `syntax-css` | string | built-in | Comma-separated URLs for code block syntax theme CSS |
| `accent-color` | string | inherited | Per-instance accent: any CSS color (`hsl(210 85% 58%)`, `#336699`, `var(--token)`) or HSL triplet (`210 85% 58%`) |
| `accent-color-hsl` | string | — | Alias for `accent-color` when passing an HSL triplet only |
| `line-focus` | string | — | Comma-separated line numbers to visually highlight in code blocks |
| `logs` | boolean | false | Enable verbose debug logging to the console |
| `hljs-src` | string | `https://esm.sh/highlight.js` | URL to load `highlight.js` from. Only fetched when the markdown contains at least one code block. Override with a local or pinned URL for offline use. |

### Observed attributes

`re-md` re-renders automatically when `src`, `transform`, `accent-color`, or `accent-color-hsl` change. All other attributes are read once at render time.

### DOM structure after render

After rendering, `re-md` replaces its content with:

```html
<re-md>
  <div ref="re-md-content">
    <!-- all rendered HTML nodes -->
  </div>
</re-md>
```

In chapter mode, `h2` headings split the content into sections:

```html
<re-md chapter-mode>
  <div ref="re-md-content">
    <section ref="0-introduction">
      <!-- content before first h2 -->
    </section>
    <section ref="1-installation">
      <h2 id="1-installation">Installation</h2>
      <!-- content under this h2 -->
    </section>
    <section ref="2-usage">
      <h2 id="2-usage">Usage</h2>
      <!-- content under this h2 -->
    </section>
  </div>
</re-md>
```

Only the section with class `--chapter-active` is visible. Sections are activated externally by setting this class on the relevant `section` element.

### Heading IDs

`re-md` generates IDs for all headings using a section-number prefix:

| Heading | Example ID |
|---------|-----------|
| `h2` (first) | `1-installation` |
| `h3` (second under first h2) | `1-2-quick-start` |
| `h4` | `1-2-3-node-js` |
| `h1` | `my-title` (no number) |

This makes every heading directly addressable as a URL hash.

### SVG auto-inlining

Any `<img src="...svg">` found in the rendered output is automatically fetched and replaced with an inline `<svg>` element. The `alt` attribute is preserved as `aria-label`. This allows SVGs to inherit CSS custom properties from the page.

---

## Transform rules

The `transform` attribute maps markdown element types to HTML elements, with optional attributes.

### Syntax

```
(mdElement: htmlElement {attr='value' attr2="value2"})
```

Multiple rules are comma-separated:

```
(h1: my-title, h2: my-subtitle, codeblock: my-code {theme='dark'})
```

### Transformable elements

| Key | Markdown source | Default HTML output |
|-----|----------------|---------------------|
| `h1` – `h6` | `# Heading` | `<h1>` – `<h6>` |
| `p` | Paragraph text | `<p>` |
| `ul` | Unordered list | `<ul>` |
| `ol` | Ordered list | `<ol>` |
| `li` | List item | `<li>` |
| `code` | `` `inline` `` | `<code>` |
| `codeblock` | ` ```lang ... ``` ` | `<pre><code>` with highlighting |
| `blockquote` | `> quoted` | `<blockquote>` |
| `a` | `[text](url)` | `<a>` |
| `img` | `![alt](src)` | `<img>` |
| `strong` | `**text**` | `<strong>` |
| `em` | `*text*` | `<em>` |
| `hr` | `---` | `<hr>` |
| `table` | Pipe tables | `<table>` |

### Custom element example

```html
<re-md
  src="/docs/api.md"
  transform="(codeblock: syntax-block {lang='auto'}, h2: section-title)"
></re-md>
```

This renders every fenced code block as a `<syntax-block lang="auto">` element (which must be a registered custom element) and every `h2` as a `<section-title>` element.

### `bg-hsl` on codeblock

The `codeblock` transform accepts a special `bg-hsl` attribute to set the code block background color:

```html
transform="(codeblock: doc-code {bg-hsl='220 100% 50%'})"
```

---

## MDC-like syntax

`re-md` supports a component block syntax inspired by [MDC](https://content.nuxtjs.org/guide/writing/mdc) (Markdown Components). This lets you embed custom elements with attributes and full markdown content directly in your `.md` files.

### Basic block

```markdown
::my-alert {type='warning' class="alert-box"}
This is a **warning** with `inline code`.
::
```

Renders as:

```html
<my-alert type="warning" class="alert-box">
  <p>This is a <strong>warning</strong> with <code>inline code</code>.</p>
</my-alert>
```

The content inside the block is processed as markdown before being inserted.

### Attribute-only block

Omit the component name to apply attributes to the first rendered element inside the block:

```markdown
::{class='highlight' style="color: red"}
> This blockquote gets the highlight class.
::
```

Renders as:

```html
<blockquote class="highlight" style="color: red">
  <p>This blockquote gets the highlight class.</p>
</blockquote>
```

The attributes are applied only when the block contains a single top-level element.

### Image with style

```markdown
::{style="width: 120px; display: block;"}
![Logo](./logo.svg)
::
```

### Slot support

Use `@slotName(content)` inside a component block to fill named or default slots:

```markdown
::feature-card {icon='star'}
  @title(Getting Started)
  @default(Everything you need to get up and running in under five minutes.)
::
```

Renders as:

```html
<feature-card icon="star">
  <span slot="title">Getting Started</span>
  Everything you need to get up and running in under five minutes.
</feature-card>
```

- `@default(content)` fills the default slot (no `slot` attribute)
- `@slotName(content)` fills `<slot name="slotName">`
- Slot content is processed as inline markdown

---

## Examples

### Minimal: external file

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script type="module">
    import remd from 'https://cdn.jsdelivr.net/npm/@nativelayer.dev/re-md/dist/re-md.esm.min.js'
    customElements.define('re-md', remd)
  </script>
</head>
<body>
  <re-md src="/content/readme.md"></re-md>
</body>
</html>
```

### Inline markdown with custom transforms

```html
<re-md transform="(h1: page-title, codeblock: syntax-block)">
  # Quick Start

  Install the package:

  ```bash
  npm install @nativelayer.dev/re-md
  ```

  Import and register it in your entry file.
</re-md>
```

### Code block with focused lines

Mark specific lines for visual emphasis using the `line-focus` attribute:

```html
<re-md line-focus="3,4,5" src="/docs/example.md"></re-md>
```

Lines 3, 4, and 5 in every code block will receive the `focus` class, which your theme CSS can style.

### Chapter mode with external activation

```html
<re-md id="content" src="/docs/guide.md" chapter-mode syntax-css="/css/code.css"></re-md>

<script type="module">
  const remd = document.getElementById('content')

  // Wait for re-md to finish rendering
  remd.ready.then(() => {
    const sections = remd.querySelectorAll('section')

    // Activate the second chapter
    sections.forEach(s => s.classList.remove('--chapter-active'))
    sections[1]?.classList.add('--chapter-active')
  })
</script>
```

### Runtime `src` change

```html
<re-md id="viewer" src="/docs/intro.md"></re-md>

<nav>
  <button data-src="/docs/intro.md">Introduction</button>
  <button data-src="/docs/api.md">API Reference</button>
  <button data-src="/docs/changelog.md">Changelog</button>
</nav>

<script type="module">
  const viewer = document.getElementById('viewer')
  document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      viewer.setAttribute('src', btn.dataset.src)
    })
  })
</script>
```

### MDC alert component

In your markdown file:

```markdown
::doc-alert {type='info'}
This feature is available from version 2.0 onward.
::

::doc-alert {type='warning'}
Calling this method before `init()` will throw.
::
```

In your HTML:

```html
<re-md src="/docs/guide.md"></re-md>

<script type="module">
  // Register a custom element for doc-alert
  class DocAlert extends HTMLElement {
    connectedCallback() {
      this.style.display = 'block'
      this.style.padding = '1em'
      this.style.background = this.getAttribute('type') === 'warning'
        ? 'hsl(40 100% 93%)'
        : 'hsl(220 100% 95%)'
    }
  }
  customElements.define('doc-alert', DocAlert)
</script>
```

### Using the `ready` promise

`re-md` exposes a `ready` promise that resolves after the first render:

```js
const remd = document.querySelector('re-md')

await remd.ready

// DOM is now fully rendered
const headings = remd.querySelectorAll('h2')
console.log(`${headings.length} sections found`)
```

### Debug logging

Enable console output to trace the render pipeline:

```html
<re-md src="/docs/guide.md" logs></re-md>
```

This logs heading ID generation, transform rule parsing, fetch operations, and SVG inlining.

---

## CSS variables

`re-md` reads the following CSS custom properties from the page. Every variable has a built-in fallback so the component renders correctly even without a design system.

### Typography

| Variable | Fallback | Used on |
|---|---|---|
| `--re-md-font-size` | `var(--f-size-p, 0.9rem)` | Table text |
| `--codeblock-font-size` | `0.875em` | Inline code, code blocks, copy button, line numbers |
| `--blockquote-font-size` | `0.95em` | `<blockquote>` |
| `--ff-3` | `monospace` | Code and table font family |

### Colors

| Variable | Fallback | Used on |
|---|---|---|
| `--re-md-accent` | `hsl(var(--accent-color-hsl, var(--fcolor-hsl)))` | Tables, inline code, blockquotes, code block chrome |
| `--re-md-accent-foreground` | `hsl(var(--over-accent-color-hsl, 250 5% 92%))` | Table header text on accent background |
| `--re-md-accent-adjusted-hard` | `--re-md-accent` | Inline code / code blocks when accent is very light (light mode) |
| `--accent-color-hsl` | `--fcolor-hsl` | Legacy triplet for external syntax CSS themes |
| `--over-accent-color-hsl` | `250 5% 92%` | Legacy triplet for table header text |
| `--fcolor-hsl` | `0 0% 0%` | Final fallback for foreground color |
| `--bcolor-hsl` | `0 0% 100%` | Table header column separators, copy button background |

Set `accent-color` on the element to override per instance (full CSS colors and `var()` references work):

```html
<re-md src="/articles/post.md" accent-color="var(--brand-accent)"></re-md>
<re-md src="/docs/guide.md" accent-color="255 75% 55%"></re-md>
```

Or override on a parent / `:root`:

```css
re-md {
  --re-md-accent: hsl(255 75% 55%);
  --re-md-accent-foreground: hsl(250 5% 92%);
}
```

### Opacity / transparency

| Variable | Fallback | Used on |
|---|---|---|
| `--inline-code-bg-opacity` | `0.06` | Inline code background |
| `--inline-code-border-opacity` | `0.2` | Inline code and copy button border |
| `--blockquote-bg-opacity` | `0.04` | Blockquote background |
| `--blockquote-border-opacity` | `0.4` | Blockquote left border |
| `--hr-border-opacity` | `0.5` | Horizontal rule |
| `--table-thead-bg-opacity` | `0.8` | Table header background |
| `--table-thead-color-opacity` | `1` | Table header text |
| `--table-th-border-opacity` | `0.5` | Table header column separators |
| `--code-block-focus-opacity` | `0.2` | Focused line highlight |

### Spacing

| Variable | Fallback | Used on |
|---|---|---|
| `--space-unit` | `0.5rem` | All internal spacing, padding, margins |
| `--size-unit` | `0.5rem` | Border-radius calculations |

Override any spacing or opacity variable on `:root` or a parent element to theme `re-md` without touching its source:

```css
:root {
  --codeblock-font-size: 0.8rem;
  --blockquote-font-size: 1em;
  --inline-code-bg-opacity: 0.08;
}
```

---

## Security

`re-md` renders markdown to HTML using `innerHTML`. This means:

**Raw HTML in markdown is rendered.** If you render user-supplied markdown, malicious users can inject arbitrary HTML including `<script>` tags, event handlers, and `<iframe>` elements. This is a known and intentional property of most markdown renderers.

**Mitigations:**

1. **Server-side sanitization.** Run untrusted input through a sanitizer (e.g. [DOMPurify](https://github.com/cure53/DOMPurify)) before storing it. Do not pass raw user input to `src` or inline content.

2. **Trusted content only.** If you only render content you control (your own `.md` files, your CMS), there is no injection risk from users.

3. **`src` validation.** The `src` attribute accepts any URL that the browser's `fetch` can reach, including `data:` URLs and cross-origin resources (subject to CORS). Validate or allowlist `src` values server-side if they are derived from user input.

4. **CSP.** A strict Content Security Policy limits the damage of any injected HTML. `re-md` does not use `eval` or dynamic `import()` from user content, so a CSP that blocks `unsafe-eval` and restricts `script-src` is compatible with normal use.

`re-md` does not sanitize content by design. Sanitization is application-specific and belongs at the data layer, not inside a rendering component.

---

## License

`re-md` is licensed under the **PolyForm Noncommercial License 1.0.0** for non-commercial use, with a commercial license option available.

### Non-Commercial Use

`re-md` is free under the **PolyForm Noncommercial License** for:

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

::base-button {class="--light" target="_blank" href="/licenses#re-md" style="padding: calc(var(--space-unit)* 3) 0"}
View re-md licensing & pricing
::

- **Email:** info@nativelayer.dev