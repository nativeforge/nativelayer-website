![nativeHtml logo](../__src/img/native-logo.svg)

# nativeHtml manifesto

## The web is already a platform

The modern web does not need to be reinvented to be powerful.

HTML, CSS, and JavaScript are not primitives waiting to be replaced — they are **mature, expressive, and continuously evolving technologies**. The browser is a runtime, not a limitation. The platform already provides layout engines, rendering pipelines, reactivity mechanisms, accessibility semantics, and performance optimizations that no abstraction can fully replicate without cost.

**nativeHtml exists to work with the web, not against it.**

> "The web is already a platform. We don't need another one on top of it." — Rich Harris, Creator of Svelte

---

## Simplicity is a feature, not a regression

Complexity is often introduced as a convenience and later mistaken for necessity.

Frameworks can accelerate delivery, but they also:

- Obscure platform fundamentals
- Introduce indirection and cognitive overhead
- Create dependency gravity and long-term maintenance cost
- Encourage patterns that fight the browser instead of leveraging it

nativeHtml promotes **intentional simplicity**:

- Fewer layers
- Fewer transformations
- Fewer abstractions
- More clarity

Simple code is not naïve code.  
Simple code is **durable, debuggable, and efficient**.

> "Simplicity is prerequisite for reliability."  — Edsger W. Dijkstra

### Complexity comparison

| Approach | Layers | Build Required | Runtime Overhead | Platform Alignment |
|----------|--------|----------------|------------------|-------------------|
| nativeHtml/CSS/JS | 1 | No | Minimal | 100% |
| Light Framework | 2-3 | Optional | Low | 80-90% |
| Heavy Framework | 4-6 | Required | High | 40-60% |
| Meta-Framework | 6+ | Required | Very High | 30-50% |

---

## HTML is not just markup

HTML is a **semantic, declarative language** with powerful native behaviors:

- Accessibility baked into elements
- Native form handling and validation
- Built-in interaction semantics
- Declarative state through attributes
- Progressive enhancement by default

nativeHtml treats HTML as the **source of truth**, not a template to be compiled away.

> "HTML is the foundation. Everything else is decoration."  — Jeremy Keith

### nativeHtml example: Interactive disclosure

```html
<details>
  <summary>Click to reveal</summary>
  <p>No JavaScript required. Built-in accessibility. Progressive enhancement.</p>
</details>
```

### Native form validation

```html
<form>
  <input type="email" required pattern="[^@]+@[^@]+\.[^@]+">
  <input type="number" min="0" max="100">
  <button type="submit">Submit</button>
</form>
```

No validation library. No form state manager. Just HTML.

---

## CSS is a real layout and logic system

CSS is no longer just decoration.

Modern CSS provides:

- Grid and Flexbox for complex layouts
- Container queries and media queries
- Custom properties as dynamic tokens
- Native animations and transitions
- Logical properties and modern selectors

nativeHtml embraces CSS as a **first-class system**, reducing the need for JavaScript where styling, layout, and responsiveness already belong.

> "CSS is the most powerful design tool ever created."  — Jen Simmons, Designer Advocate at Apple

### CSS grid layout example

```css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
```

### Container queries (modern CSS)

```css
@container (min-width: 400px) {
  .card {
    display: flex;
    flex-direction: row;
  }
}
```

### CSS custom properties as design tokens

```css
:root {
  --space-unit: 0.5rem;
  --color-primary: hsl(210 100% 50%);
}

.button {
  padding: calc(var(--space-unit) * 2);
  background: var(--color-primary);
}
```

| CSS Feature | Year Introduced | Replaces |
|-------------|----------------|----------|
| Grid Layout | 2017 | Float hacks, positioning |
| Custom Properties | 2015 | Preprocessor variables |
| Container Queries | 2022 | JavaScript resize observers |
| `:has()` Selector | 2022 | JavaScript parent selectors |
| Cascade Layers | 2022 | Complex specificity management |

---

## JavaScript should be precise, not omnipresent

JavaScript is powerful — and therefore should be used **deliberately**.

nativeHtml favors JavaScript that:
- Enhances, not replaces, native behavior
- Is scoped, readable, and explicit
- Avoids unnecessary state duplication
- Works directly with the DOM and browser APIs

Not everything needs a virtual model, a scheduler, or a compile step.

> "Make it work, make it right, make it fast."  — Kent Beck

### Native JavaScript example: Web components

```javascript
class TodoItem extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="todo">
        <input type="checkbox">
        <span>${this.getAttribute('text')}</span>
      </div>
    `;
  }
}

customElements.define('todo-item', TodoItem);
```

### Modern browser APIs

| API | Purpose | Replaces Library |
|-----|---------|------------------|
| `IntersectionObserver` | Viewport detection | Scroll libraries |
| `ResizeObserver` | Element size changes | Resize listeners |
| `MutationObserver` | DOM change detection | Polling |
| `fetch()` | HTTP requests | jQuery.ajax, axios |
| `querySelector()` | DOM selection | jQuery |
| `classList` | Class manipulation | jQuery addClass/removeClass |
| `Web Animations API` | Animations | GSAP, anime.js |
| `FormData` | Form serialization | Form libraries |

---

## No build by default, build only when necessary

The browser can execute what we write.

nativeHtml promotes:

- Directly runnable code
- Native modules
- Runtime-first architectures
- Tooling as an option, not a requirement

Build steps should solve concrete problems — not compensate for avoidable abstractions.

> "The best build tool is no build tool."  — Thomas Fuchs, Creator of Zepto.js

### ES modules: Native imports

```javascript
// No bundler required
import { formatDate } from './utils.js';
import { API_URL } from './config.js';

console.log(formatDate(new Date()));
```

### Import maps for dependencies

```html
<script type="importmap">
{
  "imports": {
    "lodash": "https://cdn.jsdelivr.net/npm/lodash@4/+esm"
  }
}
</script>

<script type="module">
  import { debounce } from 'lodash';
</script>
```

### Build step comparison

| Scenario | Build Required? | Reason |
|----------|----------------|--------|
| ES Modules | ❌ No | Native browser support |
| TypeScript | ✅ Yes | Needs compilation |
| JSX | ✅ Yes | Not valid JavaScript |
| CSS Variables | ❌ No | Native CSS feature |
| SCSS/SASS | ✅ Yes | Needs preprocessing |
| Minification | ⚠️ Optional | Production optimization |
| Tree-shaking | ⚠️ Optional | Bundle size optimization |

---

## Performance through alignment, not workarounds

The fastest code is the code the browser already understands.

nativeHtml achieves performance by:
- Avoiding unnecessary layers
- Leveraging native rendering paths
- Minimizing runtime overhead
- Letting the browser do its job

> "Premature optimization is the root of all evil, but premature abstraction is worse."  — Adapted from Donald Knuth

### Performance metrics comparison

| Metric | nativeHtml | Light Library | Heavy Framework |
|--------|-------------|---------------|-----------------|
| Initial Load (JS) | ~0 KB | 10-50 KB | 100-300 KB |
| Parse Time | ~0 ms | 10-50 ms | 100-500 ms |
| Time to Interactive | < 100 ms | 200-500 ms | 1-3 sec |
| Runtime Overhead | Minimal | Low | Significant |
| Memory Usage | Baseline | +5-20% | +50-200% |

### Real performance example

```javascript
// Framework approach: Virtual DOM diffing
function updateList(items) {
  return items.map(item => React.createElement('li', {key: item.id}, item.text));
}

// Native approach: Direct DOM manipulation
function updateList(items) {
  const fragment = document.createDocumentFragment();
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.text;
    fragment.appendChild(li);
  });
  list.replaceChildren(fragment);
}
```

> "The best way to make a program fast is to not do unnecessary work."  — Jon Bentley

---

## Modern browser support

The native web platform has matured significantly. Most modern features have excellent browser support.

### Feature support matrix

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS Grid | ✅ 57+ | ✅ 52+ | ✅ 10.1+ | ✅ 16+ |
| CSS Custom Properties | ✅ 49+ | ✅ 31+ | ✅ 9.1+ | ✅ 15+ |
| Web Components | ✅ 54+ | ✅ 63+ | ✅ 10.1+ | ✅ 79+ |
| ES Modules | ✅ 61+ | ✅ 60+ | ✅ 11+ | ✅ 16+ |
| IntersectionObserver | ✅ 51+ | ✅ 55+ | ✅ 12.1+ | ✅ 15+ |
| Container Queries | ✅ 105+ | ✅ 110+ | ✅ 16+ | ✅ 105+ |
| `:has()` Selector | ✅ 105+ | ✅ 103+ | ✅ 15.4+ | ✅ 105+ |

> "The web is not a compile target. It's a platform."  — Jake Archibald, Developer Advocate at Google

### Progressive enhancement example

```javascript
// Start with HTML that works
// <button id="share-btn">Share</button>

const shareBtn = document.getElementById('share-btn');

// Enhance if API is available
if (navigator.share) {
  shareBtn.addEventListener('click', async () => {
    await navigator.share({
      title: 'Check this out',
      url: window.location.href
    });
  });
} else {
  // Fallback: copy to clipboard
  shareBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied!');
  });
}
```

---

## What nativehtml provides

nativeHtml is a brand and ecosystem that offers:
- Lightweight libraries
- Website themes
- Helper utilities
- Component collections
- CSS frameworks

All built with the same principles:
- Native-first
- Minimal abstraction
- Transparent behavior
- Long-term maintainability

### nativeHtml stack comparison

| Concern | Traditional Stack | nativeHtml Stack |
|---------|------------------|------------------|
| UI Components | React/Vue/Angular | Web Components |
| Styling | CSS-in-JS/Tailwind | Native CSS + Custom Properties |
| State Management | Redux/MobX/Zustand | DOM State + localStorage |
| Routing | React Router | History API |
| HTTP | Axios | fetch() API |
| Animations | Framer Motion/GSAP | CSS Animations + Web Animations API |
| Forms | Formik/React Hook Form | nativeHtml Forms |
| Build Tool | Webpack/Vite | Optional (ESBuild for minification) |

> "Choose boring technology."  — Dan McKinley, Etsy

---

## Example: Complete counter app

### The HTML

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="counter">
    <button id="decrement">-</button>
    <span id="count">0</span>
    <button id="increment">+</button>
  </div>
  <script src="app.js" type="module"></script>
</body>
</html>
```

### The CSS

```css
.counter {
  display: flex;
  gap: 1rem;
  align-items: center;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1.5rem;
  border: 2px solid #333;
  background: white;
  cursor: pointer;
  transition: transform 0.1s;
}

button:active {
  transform: scale(0.95);
}

#count {
  font-size: 2rem;
  font-weight: bold;
  min-width: 3rem;
  text-align: center;
}
```

### The JavaScript

```javascript
let count = parseInt(localStorage.getItem('count')) || 0;

const countEl = document.getElementById('count');
const decrementBtn = document.getElementById('decrement');
const incrementBtn = document.getElementById('increment');

function updateCount(newCount) {
  count = newCount;
  countEl.textContent = count;
  localStorage.setItem('count', count);
}

decrementBtn.addEventListener('click', () => updateCount(count - 1));
incrementBtn.addEventListener('click', () => updateCount(count + 1));

updateCount(count);
```

**Total Size:** ~700 bytes (unminified)  
**Dependencies:** 0  
**Build Step:** None  
**Runtime Overhead:** None

> "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away."  — Antoine de Saint-Exupéry

---

## Our position

nativeHtml is not anti-framework.  
It is **anti-forgetfulness of the platform**.

We believe developers should:

- Understand the native web
- Choose abstraction consciously
- Retain control over their stack
- Build systems that age well

> "Any application that can be written in JavaScript, will eventually be written in JavaScript."  — Jeff Atwood, Atwood's Law

> "But perhaps it's time to ask: should it be?"  — The nativeHtml Community

### When to choose what

| Project Type | Recommendation | Why |
|--------------|----------------|-----|
| Marketing site | nativeHtml | Static, SEO-critical, simple |
| Blog/Documentation | nativeHtml | Content-first, long-lived |
| Dashboard/Admin | Native or Light Framework | Complex UI, frequent updates |
| E-commerce | Hybrid | Mix of static and dynamic |
| SaaS Application | Framework or Native | Team size and complexity dependent |
| Widget/Embed | nativeHtml | Small footprint critical |
| Progressive Web App | Native or Light Framework | Performance critical |

> "The web is the most hostile software engineering environment imaginable."  — Douglas Crockford

> "And yet, it's still the most accessible and resilient platform we have."  — Chris Coyier, CodePen

---

## The goal

To help developers write **HTML, CSS, and JavaScript**:

- More simply
- More efficiently
- More intentionally

Using the web **as it was designed to be used**.

> "The web is agreement."  — Jeremy Keith

### The nativehtml principles

| Principle | Meaning |
|-----------|---------|
| **Platform-First** | Use native features before reaching for abstractions |
| **Zero-Build Default** | Start without build tools, add them only when needed |
| **Progressive Enhancement** | Build a working baseline, enhance for capable browsers |
| **Performance by Subtraction** | Fast by doing less, not by optimizing more |
| **Long-Term Thinking** | Code that works today should work in 10 years |
| **Explicit Over Implicit** | Clear behavior over magical abstractions |
| **Standards-Aligned** | Follow web standards, not framework conventions |

> "The best technology is the one you don't notice." — Dieter Rams

> "The web already has that technology. It's called HTML." — Sir Tim Berners-Lee, Inventor of the World Wide Web

---

**nativeHtml — build closer to the platform.**

*Write less. Ship faster. Last longer.*
