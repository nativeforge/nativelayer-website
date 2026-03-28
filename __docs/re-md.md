:: { style="width: 96px; height: auto;" }
![re-md logo](../__src/img/remd-logo.svg)
::

# re-md

A markdown transformation Web Component that processes markdown content (from external files or inline) and renders it as HTML with customizable element transforms, syntax highlighting, component blocks, and chapter-mode navigation.

`re-md` provides:

- **re-md**: Markdown processor with transform rules, component blocks (MDC-style), syntax highlighting, tables, and chapter mode.
- **doc-aside**: Fixed sidebar navigation built from document headings, with expand/collapse, search, and section numbering.
- **doc-body**: Main content area with heading link icons, section numbering, and chapter-mode support.
- **doc-card**: Previous/next chapter navigation cards for chapter-mode layouts.

All components are framework-agnostic Custom Elements.

## Installation

Import and register the custom elements in your HTML or JavaScript:

```html
<script type="module">
  import remd from "/__src/components/re-md.js"
  import docBody from "/__src/components/doc-body.js"
  import docCard from "/__src/components/doc-card.js"
  import docAside from "/__src/components/doc-aside.js"

  customElements.define('re-md', remd)
  customElements.define('doc-body', docBody)
  customElements.define('doc-card', docCard)
  customElements.define('doc-aside', docAside)
</script>
```

Ensure your page loads the required CSS (reset, fonts, global-styles) and defines the layout variables (`--doc-aside-width`, `--top-bar-height`, etc.).

## Basic Usage

Minimal setup for a documentation page:

```html
<doc-aside expander-color="hsl(var(--accent-color-hsl))" section-numbers></doc-aside>
<doc-body>
  <re-md src="/path/to/doc.md" theme-css="/__src/css/code-syntax.css" chapter-mode></re-md>

  <flex-container direction="row" style="gap: calc(var(--space-unit) * 4);">
    <doc-card data-label="previous"></doc-card>
    <doc-card data-label="next"></doc-card>
  </flex-container>
</doc-body>
```

- **doc-aside** builds its navigation from headings inside **doc-body**.
- **re-md** fetches and renders the markdown. Use `chapter-mode` to split content by `h2` sections.
- **doc-card** shows previous/next chapter links when `chapter-mode` is active.

## re-md

The `re-md` custom element processes markdown and outputs HTML. It supports external files via `src` or inline content.

### Attributes

| Attribute      | Type    | Description                                                               |
|----------------|---------|---------------------------------------------------------------------------|
| `src`          | string  | URL of the markdown file to fetch and render                              |
| `transform`    | string  | Rules to map markdown elements to custom HTML elements                    |
| `logs`         | boolean | Enable debug logging when present                                         |
| `chapter-mode` | boolean | Split content into sections by `h2`; only one section visible at a time   |
| `theme-css`    | string  | Comma-separated URLs for code block syntax theme CSS                      |
| `line-focus`   | string  | Comma-separated line numbers to highlight in code blocks                  |

### External file

```html
<re-md src="./docs/readme.md" transform="(codeblock: doc-code)"></re-md>
```

### Inline content

```html
<re-md transform="(h1: doc-title, code: inline-code)">
  # My Title
  This is **inline markdown** with `code`.
</re-md>
```

### Transform rules

The `transform` attribute maps markdown element types to HTML elements and optional attributes:

```html
(mdElement: htmlElement {attr='value'})
```

Examples:

```html
(h1: doc-title)
```

```html
(codeblock: doc-code {mode='dark'})
```

Multiple rules are comma-separated:

```html
(h1: doc-title, code: inline-code, codeblock: doc-code {theme='dark'})
```

Default mappings (when `transform` is omitted):

| Markdown     | Default HTML   |
|--------------|----------------|
| h1–h6        | h1–h6          |
| p            | p              |
| ul, ol, li   | ul, ol, li     |
| code         | code           |
| codeblock    | code (pre)     |
| blockquote   | blockquote     |
| a, img       | a, img         |
| strong, em   | strong, em     |
| hr           | hr             |
| table        | table          |

### Component blocks (MDC-style)

Inside you markdown content, wrap content in a custom component with attributes:

```markdown
::component-name {class='value' id="my-id" data-foo="bar"}
This is **markdown** content inside the component.
::
```

Attribute-only blocks (no component name) apply attributes to the first rendered element:

```markdown
::{class='highlight' style="color: red"}
> This blockquote gets the highlight class
::
```

### Slot support

Use `@slotName(content)` and `@default(content)` for named and default slots:

```markdown
::my-component {type='card'}
  @header(Chapter title here)
  @default(Main content with **markdown**.)
::
```

### Element types

- **code**: Inline code `text` → \<code\>text\</code\>
- **codeblock**: Fenced blocks \`\`\`lang ... \`\`\` → syntax-highlighted \<pre\>\<code\> or custom element (e.g. `doc-code`)

### Chapter mode

With `chapter-mode`, content is split into sections by `h2` headings. Only one section is visible at a time. The first section (before the first `h2`) uses `ref="0-introduction"`. Sections are toggled via **doc-aside** navigation and URL hash.


## doc-aside

A fixed sidebar that builds a navigation tree from headings (h1–h6) inside `doc-body`. It includes search, expand/collapse, and optional section numbering.

### Attributes

| Attribute        | Type   | Description |
|------------------|--------|-------------|
| `expander-color`  | string | CSS color for the expand/collapse arrow (default: `hsla(var(--fcolor-hsl, 0 0% 0%) / .6)`) |
| `section-numbers`| boolean | Show section numbers (e.g. 1., 2., 3.) next to nav items when present |

### Structure

`doc-aside` renders:

- **Header**: Search input, expand/fold/number icons, document title (from h1)
- **Content**: Hierarchical list of h2–h6 with collapsible `details`/`summary`
- **Footer**: Branding (e.g. "Powered by re-md")

### Behavior

- Listens for `doc-body-ready` and `DOMContentLoaded` to build navigation from headings in `doc-body`.
- Clicking a nav link scrolls to the heading and updates the URL hash.
- In **chapter-mode**, clicking a link activates the parent section and scrolls to the heading.
- Expand icon: open all `details`. Fold icon: close all. Numbers icon: toggle `section-numbers`.

### Chapter mode

When `re-md` has `chapter-mode`, `doc-aside`:

- Uses h2 IDs as chapter refs.
- Highlights the active chapter/section in the nav.
- Title link scrolls to `#0-introduction`.


## doc-body

The main content container. It lays out the document, adds heading link icons, and manages chapter state when `re-md` uses `chapter-mode`.

### Layout

`doc-body` is positioned to the right of `doc-aside` and uses:

- `--doc-aside-width`: width of the sidebar
- `--top-bar-height`: offset for fixed headers
- `--page-padding-x`: horizontal padding

On viewports under 60rem, the aside is hidden and `doc-body` spans the full width.

### Events

| Event            | When |
|------------------|------|
| `doc-body-ready` | Fired when content is ready (including after `re-md` processing) |
| `chapter-change` | Fired when the active chapter changes (detail: `{ index, map }`) |

### Heading behavior

- Headings get auto-generated IDs (section numbers for h2–h6, e.g. `1-2-installation`).
- Hovering a heading shows a link icon (`#`).
- Clicking a heading copies its URL to the clipboard and scrolls to it (with smooth scroll).
- Section numbers (1., 1.1., etc.) are rendered via CSS counters.

### Chapter mode

When `re-md` has `chapter-mode`:

- `doc-body` receives `chapterMap` and `chapterIndex` from `doc-aside`.
- `chapterIndex` updates when the user navigates; `chapter-change` is dispatched.
- `doc-card` uses this to show previous/next chapter links.


## doc-card

A navigation card that shows the previous or next chapter. Used at the bottom of documentation pages in chapter-mode.

### Attributes

| Attribute    | Type   | Description |
|--------------|--------|-------------|
| `data-label` | string | `"previous"` or `"next"` — determines direction and label |

### Usage

```html
<doc-card data-label="previous"></doc-card>
<doc-card data-label="next"></doc-card>
```

### Behavior

- Listens for `chapter-change` from `doc-body`.
- Updates its link and label based on `chapterMap` and current `chapterIndex`.
- Hides when there is no previous/next chapter (e.g. first or last).
- Clicking prevents default navigation and updates the hash via `history.pushState`, then dispatches `hashchange` for routing.

### Chapter name formatting

IDs like `0-introduction` or `3-plugin-system` are formatted as "Introduction" and "Plugin System" for display.


## Snippets

### Full documentation page

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentation</title>
  <link rel="stylesheet" href="/__src/css/reset.css">
  <link rel="stylesheet" href="/__src/css/fonts.css">
  <link rel="stylesheet" href="/__src/css/global-styles.css">
  <script type="module">
    import { router } from "/__src/js/router.js";
    router.start();
  </script>
  <script type="module">
    import remd from "/__src/components/re-md.js"
    import docBody from "/__src/components/doc-body.js"
    import docCard from "/__src/components/doc-card.js"
    import docAside from "/__src/components/doc-aside.js"
    import topBar from "/__src/components/top-bar.js"
    import flexContainer from "/__src/components/flex-container.js"

    customElements.define('re-md', remd)
    customElements.define('doc-body', docBody)
    customElements.define('doc-card', docCard)
    customElements.define('doc-aside', docAside)
    customElements.define('top-bar', topBar)
    customElements.define('flex-container', flexContainer)
  </script>
</head>
<body>
  <top-bar></top-bar>
  <doc-aside expander-color="hsl(var(--accent-color-hsl))" section-numbers></doc-aside>
  <doc-body>
    <re-md src="/docs/my-doc.md" theme-css="/__src/css/code-syntax.css" chapter-mode></re-md>

    <flex-container direction="row" style="position: absolute; gap: calc(var(--space-unit) * 4); bottom: calc(var(--space-unit) * 4);">
      <doc-card data-label="previous"></doc-card>
      <doc-card data-label="next"></doc-card>
    </flex-container>
  </doc-body>
</body>
</html>
```

### Inline markdown with transform

```html
<re-md transform="(h1: h1, codeblock: doc-code)">
  # Quick Start

  Install with:

  ```bash
  npm install my-package
  ```

  Use `my-package` in your code.
</re-md>
```

### Component block example

```markdown
::doc-alert {type='warning' class="alert-box"}
This is a **warning** message with `inline code`.
::
```

Renders as `\<doc-alert type="warning" class="alert-box">...\</doc-alert\>` (assuming `doc-alert` is a registered custom element).
