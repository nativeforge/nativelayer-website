:: { style="width: 96px; height: auto;" }
![reflectx logo](../__src/img/reflectx-logo.svg)
::

[![npm version](https://img.shields.io/npm/v/@nativelayer.dev/reflectx.svg)](https://www.npmjs.com/package/@nativelayer.dev/reflectx)
[![License](https://img.shields.io/badge/license-PolyForm%20NC%201.0.0-blue.svg)](./LICENSE)
[![Bundle size](https://img.shields.io/badge/minified-~17KB-green.svg)]()

# reflectx

`reflectx` is a lightweight dependency-free templating and DOM binding engine designed for use within Custom Elements (Web Components) and plain HTML. It provides declarative reactive templating features through directives, making it easy to create dynamic, state-driven components without a full framework.

- Minified: ~17 KB (ESM), ~17.1 KB (CJS)
- Gzipped: ~5.5 KB

> `reflectx` is pre-1.0; minor breaking changes may occur before 1.0. Pin your version for production use.

## Table of Contents

- [Quick Start](#quick-start)
- [Why reflectx?](#why-reflectx)
- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [Directives](#directives)
- [Plugin System](#plugin-system)
- [Browser Support](#browser-support)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

```html
<div id="app">
  <h2 x-text="title"></h2>
  <template x-for="item of items">
    <span x-text="item.name"></span>
  </template>
</div>
<script type="module">
  import { reflectx } from 'https://unpkg.com/@nativelayer.dev/reflectx@latest/dist/reflectx.esm.min.js';
  const state = { title: 'Hello', items: [{ name: 'World' }] };
  reflectx(state, document.querySelector('#app'));
</script>
```

## Why reflectx?

- **Custom Elements first** — Works with Web Components and plain HTML, no framework overhead
- **No build step** — Use via CDN or npm, no build required
- **Explicit control** — Call `reflectx(state, element)` when you want to re-render
- **Alpine-like syntax** — Familiar directives (`x-if`, `x-for`, `@click`, etc.) with `x-` prefix
- **Plugin system** — Extend with custom plugins

## Installation

### Via NPM

```bash
npm install @nativelayer.dev/reflectx
```

Then import in your project:

```js
// ES Module (recommended)
import { reflectx } from '@nativelayer.dev/reflectx';

// CommonJS
const { reflectx } = require('@nativelayer.dev/reflectx');
```

### Via CDN (No Build Step)

#### unpkg

```html
<!-- ES Module -->
<script type="module">
  import { reflectx } from 'https://unpkg.com/@nativelayer.dev/reflectx@latest/dist/reflectx.esm.min.js';
</script>

<!-- Or use specific version -->
<script type="module">
  import { reflectx } from 'https://unpkg.com/@nativelayer.dev/reflectx@0.3.2/dist/reflectx.esm.min.js';
</script>
```

#### esm.sh

```html
<!-- Latest version -->
<script type="module">
  import { reflectx } from 'https://esm.sh/@nativelayer.dev/reflectx@latest'
</script>

<!-- Or with specific version -->
<script type="module">
  import { reflectx } from 'https://esm.sh/@nativelayer.dev/reflectx@0.3.2'
</script>
```

#### Skypack

```html
<script type="module">
  import { reflectx } from 'https://cdn.skypack.dev/@nativelayer.dev/reflectx'
</script>

<!-- Or with specific version -->
<script type="module">
  import { reflectx } from 'https://cdn.skypack.dev/@nativelayer.dev/reflectx@0.3.2';
</script>
```

### From Source (Local Development)

Clone the repository and use the source directly:

```bash
git clone https://github.com/ynck-chrl/reflectx.git
cd reflectx
```

Then import from source:

```html
<script type="module">
  import { reflectx } from './src/reflectx.js';
</script>
```

Or if using in a Node.js project:

```js
import { reflectx } from './path/to/reflectx/src/reflectx.js';
```

### Build Outputs

When installed via NPM, `reflectx` provides multiple build outputs:

- **ESM (ES Modules)**: `dist/reflectx.esm.min.js` - For modern browsers and bundlers
- **CommonJS**: `dist/reflectx.cjs.min.js` - For Node.js and legacy tools
- **Source Maps**: Available for all builds (`.map` files)

The `package.json` exports field automatically selects the correct build:

```json
{
  "exports": {
    ".": {
      "import": "./dist/reflectx.esm.min.js",
      "require": "./dist/reflectx.cjs.min.js"
    }
  }
}
```

### TypeScript Support

TypeScript definitions are not yet included. You can create a declaration file:

```typescript
// reflectx.d.ts
declare module 'reflectx' {
  export function reflectx(state: any, element: HTMLElement): void;
  export function use(plugin: any): typeof reflectx;
  // Add other exports as needed
}
```

## Core Concepts

`reflectx` is a function that takes a state object and a DOM element, then processes templating directives within that element. It provides several directives to handle common UI patterns:

- `x-if` for conditional rendering
- `x-for` for loop rendering
- `x-class` for conditional classes
- `x-*` for dynamic attributes
- `x-text` for text content interpolation
- `@event` or `x-on:event` for event handling
- `x-text.plugin` for custom plugin execution

## Logging System

reflectx includes a flexible logging system controlled by the `logs` attribute. You can enable logging for specific features:

```html
<!-- Enable all logs -->
<my-component logs="all"></my-component>

<!-- Enable specific feature logs -->
<my-component logs="for, if, attr, class, text, on, plugins"></my-component>
```

Available log categories:

- `for`: x-for loop processing
- `if`: x-if conditional rendering
- `attr`: x-attr attribute processing
- `class`: x-class processing
- `text`: x-text content rendering
- `on`: Event handler attachment
- `plugins`: Plugin execution and results

### Log Aliases

Each log category supports multiple aliases for convenience. You can use either the short name or the `x-` prefixed version:

| Short name | x- prefixed | Notes |
|------------|-------------|-------|
| `for` | `x-for` | |
| `if` | `x-if` | |
| `attr` | `x-attr` | |
| `class` | `x-class` | |
| `text` | `x-text` | |
| `on` | `x-on` | Also accepts `events` as an alias |
| `plugins` | — | No x- prefix variant |
| `all` | — | Enables all logs |

```html
<!-- These are equivalent -->
<my-component logs="text, class"></my-component>
<my-component logs="x-text, x-class"></my-component>

<!-- Enable event logs using any alias -->
<my-component logs="on"></my-component>
<my-component logs="x-on"></my-component>
<my-component logs="events"></my-component>
```

### HTML syntax helper (IDE Syntax Highlighting)

reflectx exports an `html` template tag function that enables HTML syntax highlighting in your IDE when writing templates as template literals:

```js
import { reflectx, html } from '@nativelayer.dev/reflectx';

class MyComponent extends HTMLElement {
  connectedCallback() {
    // The html tag enables syntax highlighting in VS Code, WebStorm, etc.
    this.innerHTML = html`
      <div>
        <h2 x-text="title"></h2>
        <template x-for="item of items">
          <span x-text="item.name"></span>
        </template>
      </div>
    `;
    reflectx(this.state, this);
  }
}
```

The `html` tag is purely for IDE support and doesn't transform the string - it returns the template literal as-is. Most modern IDEs will recognize this pattern and provide HTML syntax highlighting, autocompletion, and formatting within the template.

## Basic Usage

### With Custom Elements (Web Components)

#### With Internal State and Shadow DOM

```js
import { reflectx } from 'reflectx';

class TodoApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Internal component state
    this.state = {
      title: 'My Tasks',
      todos: [
        { id: 1, text: 'Learn reflectx', done: true },
        { id: 2, text: 'Take a nap', done: false }
      ]
    };
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div>
        <h2 x-text="title"></h2>
        <template x-for="todo of todos">
          <div x-class="(completed, todo.done)">
            <span x-text="todo.text"></span>
            <button @click="toggleTodo(todo)">Toggle</button>
          </div>
        </template>
      </div>
    `;
    // Pass state and element - renders into shadowRoot
    reflectx(this.state, this);
  }

  toggleTodo(todo) {
    todo.done = !todo.done;
    // Re-render after state change
    reflectx(this.state, this);
  }
}
```

#### With Internal State and Light DOM

```js
import { reflectx } from 'reflectx';

class TodoApp extends HTMLElement {
  constructor() {
    super();
    
    // Internal component state
    this.state = {
      title: 'My Tasks',
      todos: [
        { id: 1, text: 'Pet the cat', done: true },
        { id: 2, text: 'Drink more coffee', done: false }
      ]
    };
  }

  connectedCallback() {
    // Render directly into light DOM (no shadow root)
    this.innerHTML = `
      <div>
        <h2 x-text="title"></h2>
        <template x-for="todo of todos">
          <div x-class="(completed, todo.done)">
            <span x-text="todo.text"></span>
            <button @click="toggleTodo(todo)">Toggle</button>
          </div>
        </template>
      </div>
    `;
    // Pass state and element - renders into element itself (light DOM)
    reflectx(this.state, this);
  }

  toggleTodo(todo) {
    todo.done = !todo.done;
    // Re-render after state change
    reflectx(this.state, this);
  }
}
```

#### With External/Global State

```js
import { reflectx } from 'reflectx';
import { state } from './state.js'; // External state (could be from a store)

class GlobalTodoList extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div>
        <h2 x-text="title"></h2>
        <template x-for="(todo, index) of todos">
          <div x-class="(completed, todo.done) (pending, !todo.done)">
            <span x-text="index + 1"></span>.
            <span x-text="todo.text"></span>
            <button @click="toggleTodo(todo)">Toggle</button>
          </div>
        </template>
      </div>
    `;
    // Use external state with this element
    reflectx(state, this);
  }

  toggleTodo(todo) {
    todo.done = !todo.done;
    // Re-render with external state
    reflectx(state, this);
  }
}
```

**Key Points:**
- **First argument**: Always the state object (can be `this.state`, an external state, or any object/array)
- **Second argument**: Always the DOM element (`this` in Custom Elements)
- **Rendering target**: If element has `shadowRoot`, renders into it; otherwise renders into the element itself (light DOM)
- **Template expressions**: Reference properties directly from the state object (e.g., `title`, `todos`, not `state.title`)


### With Plain HTML

You can also use `reflectx` with plain HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { reflectx } from './src/reflectx.js';
    
    // Create a state object with your data
    const state = {
      title: 'My Tasks',
      todos: [
        { id: 1, text: 'Touch grass', done: false },
        { id: 2, text: 'Google the error', done: true }
      ]
    };
    
    // Get the container element
    const container = document.querySelector('#app');
    
    // Initial render
    reflectx(state, container);
    
    // To update after state changes:
    // state.todos.push({ id: 3, text: 'Ship it', done: false });
    // reflectx(state, container);
  </script>
</head>
<body>
  <div id="app">
    <h2 x-text="title">My Tasks</h2>
    <template x-for="todo of todos">
      <div x-class="(completed, todo.done)">
        <span x-text="todo.text"></span>
      </div>
    </template>
  </div>
</body>
</html>
```

**Key Points for Plain HTML Usage:**
- Create a state object with your data
- Pass the state and container element to `reflectx(state, element)`
- Call `reflectx(state, element)` again after state changes to re-render
- Event handlers (like `@click`) can reference methods if you add them to the element's prototype or use inline expressions

### With CommonJS (Node.js)

```js
// Import using CommonJS
const { reflectx } = require('@nativelayer.dev/reflectx');

// Create a state object with your data
const state = {
  title: 'Server Tasks',
  todos: [
    { id: 1, text: 'Fix production bug', done: false },
    { id: 2, text: 'Blame the intern', done: true }
  ]
};

// Note: reflectx requires a DOM environment
// For Node.js, use with a DOM implementation like jsdom
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
  <div id="app">
    <h2 x-text="title">Server Tasks</h2>
    <template x-for="todo of todos">
      <div x-class="(completed, todo.done)">
        <span x-text="todo.text"></span>
      </div>
    </template>
  </div>
`);

// Set up global document for reflectx
global.document = dom.window.document;

// Get the container element
const container = dom.window.document.querySelector('#app');

// Call reflectx with state and element
reflectx(state, container);
```

**When to Use `reflectx.cjs`:**

Use the CommonJS build (`dist/reflectx.cjs`) in these scenarios:

1. **Node.js Build Tools**: When using bundlers or build systems that require CommonJS (older Webpack configs, some testing frameworks)
2. **Server-Side Rendering (SSR)**: When rendering components on the server with a DOM implementation like jsdom or happy-dom
3. **Legacy Node.js Projects**: Projects that haven't migrated to ES modules (`type: "module"` in package.json)
4. **Testing Environments**: Jest or other test runners configured for CommonJS (though modern Jest supports ESM)
5. **npm Package Distribution**: When publishing packages that need to support both module systems

**Note**: `reflectx` requires a DOM environment. For Node.js/server usage, you must provide a DOM implementation (jsdom, happy-dom, linkedom) since `reflectx` uses `document`, `Element`, `querySelectorAll`, etc.

For modern projects with native ESM support, prefer the ESM build (`dist/reflectx.esm.min.js`) instead.

### With Reactive State Libraries

reflectx works seamlessly with reactive state management libraries. Here's an example using a Proxy-based reactive state:

```js
import { reflectx } from 'reflectx';
import { restate } from 'restate'; // Or any reactive state library

// Create reactive state
const state = restate({
  title: 'My Tasks',
  todos: [
    { id: 1, text: 'Deploy to production', done: false },
    { id: 2, text: 'Write tests (maybe)', done: false }
  ]
});

class TodoComponent extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div>
        <h2 x-text="title"></h2>
        <template x-for="todo of todos">
          <div x-class="(completed, todo.done)">
            <span x-text="todo.text"></span>
            <button @click="toggleTodo(todo)">Toggle</button>
          </div>
        </template>
      </div>
    `;
    
    // Initial render
    reflectx(state, this);
    
    // Set up automatic re-rendering on state changes
    state.$onChange(() => {
      reflectx(state, this);
    });
  }
  
  toggleTodo(todo) {
    // Just mutate - reactive state will trigger re-render
    todo.done = !todo.done;
  }
}
```

**Benefits of Reactive State:**
- Automatic re-rendering when state changes
- No need to manually call `reflectx()` after every update
- Works with any Proxy-based reactive library
- `reflectx` handles circular references and deep objects safely

### HTML Template Tag Helper (IDE Syntax Highlighting)

reflectx exports an `html` template tag function that enables HTML syntax highlighting in your IDE when writing templates as template literals:

```js
import { reflectx, html } from '@nativelayer.dev/reflectx';

class MyComponent extends HTMLElement {
  connectedCallback() {
    // The html tag enables syntax highlighting in VS Code, WebStorm, etc.
    this.innerHTML = html`
      <div>
        <h2 x-text="title"></h2>
        <template x-for="item of items">
          <span x-text="item.name"></span>
        </template>
      </div>
    `;
    reflectx(this.state, this);
  }
}
```

The `html` tag is purely for IDE support and doesn't transform the string - it returns the template literal as-is. Most modern IDEs will recognize this pattern and provide HTML syntax highlighting, autocompletion, and formatting within the template.

## Directives

### 1. Conditional Rendering (`x-if`)

```html
<div x-if="someCondition">
  Only shown when condition is true
</div>
```

The element is completely removed from the DOM (not just hidden) when the condition is false.

### 2. List Rendering (`x-for`)

Supports two syntaxes:

```html
<!-- Simple iteration -->
<template x-for="todo of todos">
  <div x-text="todo.text"></div>
</template>

<!-- With index -->
<template x-for="(todo, index) of todos">
  <div x-text="(index + 1) + '. ' + todo.text"></div>
</template>
```

#### Performance Optimization with `x-key`

For improved performance when updating lists, use the `x-key` attribute to enable **per-item diffing**:

```html
<!-- Without x-key: full re-render on every change -->
<template x-for="(todo, index) of todos">
  <div x-text="todo.text"></div>
</template>

<!-- With x-key: only changed items are re-rendered -->
<template x-for="(todo, index) of todos">
  <div x-text="todo.text" x-key="todo.id"></div>
</template>
```

**How `x-key` works:**
- Each item is tracked by its unique `x-key` value (e.g., `todo.id`, `index`, or any unique expression)
- When the array changes, `reflectx` compares the new items with the old ones by their `x-key`
- **Reuses existing DOM nodes** for items that haven't changed (only updates their data)
- **Creates new nodes** only for new items
- **Removes nodes** only for deleted items
- **Reorders nodes** efficiently when items are moved

**Performance benefits:**
- ✅ **Faster updates**: Only changed items are processed, not the entire list
- ✅ **Preserves DOM state**: Input focus, scroll position, and animations are maintained
- ✅ **Reduces layout thrashing**: Minimal DOM manipulation
- ✅ **Better for large lists**: Scales well with thousands of items

**When to use `x-key`:**
- Lists that frequently update (add/remove/reorder items)
- Large lists (100+ items)
- Lists with user input (forms, checkboxes, text fields)
- Lists with animations or transitions

**Best practices:**
- Use a **unique, stable identifier** like `todo.id` or `item.uuid`
- Avoid using `index` as value for `x-key` if items can be reordered or filtered
- The `x-key` expression is evaluated for each item and should return a primitive value (string, number)

Features:
- Uses `<template>` tag to define the repeatable content
- Maintains its own render cache per iteration
- Supports deep change detection for arrays
- Provides iteration context to nested elements
- **Per-item diffing with `x-key` for optimal performance**

### 3. Class Binding (`x-class`)

Two syntaxes available:

```html
<!-- Single class with condition -->
<div x-class="highlight, isActive">
</div>

<!-- Multiple class/condition pairs -->
<div x-class="(selected, isSelected) (highlight, isHighlighted)">
</div>
```

### 4. Dynamic Attributes (`x-*`)

Any attribute prefixed with `x-` (except special directives) becomes dynamic:

```html
<input x-value="inputValue">
<img x-src="imageUrl">
<div x-data-id="getId()">
```

### 5. Text Content (`x-text`)

Renders dynamic text content:

```html
<!-- Simple value -->
<span x-text="message"></span>

<!-- With condition -->
<span x-text="message, isVisible">
  Default text when not visible
</span>
```

Features:

- Supports expressions
- Can access component methods and properties
- Handles objects (converts to JSON)
- Supports conditional rendering

### 6. Event Handling (`@event` / `x-on:event`)

Two equivalent syntaxes are available for event handlers:

```html
<!-- @ shorthand syntax (recommended) -->
<button @click="handleClick()">Click me</button>

<!-- x-on: prefix syntax -->
<button x-on:click="handleClick()">Click me</button>
```

Both syntaxes work identically - use whichever you prefer:

```html
<!-- Click events -->
<button @click="handleClick()">Click me</button>
<button x-on:click="handleClick()">Click me</button>

<!-- Form events -->
<input @input="updateValue(event.target.value)"
       @focus="handleFocus()"
       @blur="handleBlur()">

<!-- Keyboard events -->
<input @keyup="handleKeyUp(event)"
       @keydown="handleKeyDown(event)">
```

The event object is automatically available in handlers as `event`.

## Plugin System

reflectx includes a powerful plugin system that allows you to extend templating functionality with custom directives.

### Using Plugins

Plugins are registered using the `use()` method, which is chainable:

```js
import { reflectx } from 'reflectx';
import { myCustomPlugin } from './plugins/my-plugin.js';

// Register plugin (chainable)
reflectx.use(myCustomPlugin);

// Or chain multiple plugins
reflectx
  .use(plugin1)
  .use(plugin2)
  .use(plugin3);
```

### Using Plugin Directives in Templates

Once registered, plugins can be used with the `x-text.pluginName` attribute:

```html
<!-- Using a custom formatter plugin -->
<span x-text.format="todo.text">Default Task</span>

<!-- Using a custom i18n plugin -->
<p x-text.i18n="greeting">Hello!</p>

<!-- Generic plugin syntax -->
<span x-text.plugin="myPlugin('arg1', 'arg2')">Fallback</span>
```

### Creating Custom Plugins

A plugin is an object with specific properties and methods:

```js
export const myPlugin = {
  // Required: Plugin name (used in x-text.pluginName)
  name: 'myPlugin',
  
  // Required: Main execution function
  execute(value, ...args) {
    // Process the value and return result
    // The returned string becomes the element's textContent
    return processedValue;
  },
  
  // Optional: Called once before any plugin executes
  onBeforeRender(root, component) {
    // Initialize plugin state
    // Access to root element and component context
  },
  
  // Optional: Called before each element execution
  onBeforeExecute(element, rawValue, context) {
    // Setup for this specific element
    // Can modify element attributes, add classes, etc.
  },
  
  // Optional: Called after each element execution
  onAfterExecute(element, rawValue, context) {
    // Cleanup or post-processing for this element
  },
  
  // Optional: Called once after all plugins execute (can be async)
  async onAfterRender(root, context) {
    // Final cleanup or async operations
    // This is the only lifecycle hook that supports async
  }
};
```

### Plugin Example: Text Formatter

Here's a complete example of a text formatting plugin:

```js
export const formatPlugin = {
  name: 'format',
  
  execute(value, format = 'uppercase') {
    if (typeof value !== 'string') {
      value = String(value);
    }
    
    switch(format) {
      case 'uppercase':
        return value.toUpperCase();
      case 'lowercase':
        return value.toLowerCase();
      case 'capitalize':
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      case 'reverse':
        return value.split('').reverse().join('');
      default:
        return value;
    }
  }
};

// Register the plugin
reflectx.use(formatPlugin);
```

Usage in template:

```html
<span x-text.format="todo.text, 'capitalize'">buy milk</span>
<span x-text.format="title, 'uppercase'">my tasks</span>
```

### Plugin Example: Conditional Formatter

A more advanced plugin with lifecycle hooks:

```js
export const conditionalPlugin = {
  name: 'showIf',
  
  onBeforeRender(root, component) {
    // Store original content for elements using this plugin
    this.originalContent = new WeakMap();
  },
  
  execute(condition, trueValue, falseValue = '') {
    // Evaluate condition and return appropriate value
    return condition ? trueValue : falseValue;
  },
  
  onAfterExecute(element, rawValue, context) {
    // Add a custom class based on the condition
    const condition = rawValue.split(',')[0].trim();
    if (condition) {
      element.classList.add('visible');
    } else {
      element.classList.remove('visible');
    }
  }
};
```

### Plugin Best Practices

1. **Validate Inputs**: Always validate and sanitize plugin inputs
2. **Handle Errors Gracefully**: Use try-catch to prevent plugin errors from breaking rendering
3. **Keep Plugins Focused**: Each plugin should do one thing well
4. **Document Parameters**: Clearly document what arguments your plugin expects
5. **Return Strings**: The `execute()` method should return a string (or value that converts to string)
6. **Avoid Side Effects**: Minimize DOM manipulation outside of the element being processed

### Security Considerations for Plugins

When creating plugins, be mindful of security:

```js
export const safePlugin = {
  name: 'safe',
  
  execute(userInput) {
    // Validate input type
    if (typeof userInput !== 'string') {
      return '';
    }
    
    // Sanitize HTML entities
    return userInput.replace(/[<>&"']/g, char => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }
};
```

## Security

reflectx is designed with security as a core principle, implementing several protective measures to prevent common web vulnerabilities:

### XSS Prevention Through Safe Content Handling

**No innerHTML Usage for Dynamic Content**
- `reflectx` never uses `innerHTML` for dynamic content rendering
- All user data is inserted using `textContent`, which automatically escapes HTML
- This prevents malicious script injection through user-controlled data

```js
// Safe: User input is escaped automatically
<span x-text="userInput"></span>  // Uses textContent internally

// Unsafe (what `reflectx` avoids):
element.innerHTML = userInput;    // Could execute scripts
```

### Sandboxed Expression Evaluator

**Custom Mini-Evaluator Instead of eval()**
- `reflectx` includes a custom expression parser that never uses `eval()` or `Function()`
- Only supports safe operations: property access, method calls, basic operators
- Prevents arbitrary code execution through template expressions

**Whitelisted Global Access**
- Only safe global objects are accessible: `Math`, `Date`, `Number`, `String`, `Boolean`, `JSON`, `Array`
- No access to dangerous globals like `window`, `document`, or `eval`
- Controlled execution environment limits potential attack vectors

```js
// Safe expressions supported:
x-text="todo.text"                    ✓
x-text="Math.max(a, b)"              ✓
x-text="items.length > 0 ? 'Yes' : 'No'" ✓

// Dangerous expressions blocked:
x-text="eval('malicious code')"       ✗ (eval not accessible)
x-text="window.location = 'evil.com'" ✗ (window not accessible)
```

### Template Content Security

**Safe Template Processing**

- Template elements (`<template x-for>`) use `.content` property, not innerHTML
- Attributes are processed safely without executing embedded scripts
- Event handlers are properly scoped and don't use string-to-function conversion

### Best Practices for Secure Usage

1. **Validate Inputs**: Always validate and sanitize user inputs before adding them to state
2. **Context Isolation**: Each component maintains its own isolated context
3. **No Script Injection**: User data in expressions is evaluated safely, not executed as code
4. **Safe State Updates**: Mutate state objects directly and call `reflectx()` to re-render, avoiding innerHTML manipulation

```js
// Safe state update example
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.state = {
      userInput: ''
    };
  }
  
  handleInput(event) {
    // Validate and sanitize
    const value = event.target.value;
    if (typeof value === 'string' && value.length < 100) {
      this.state.userInput = value.trim();
      reflectx(this.state, this); // Safe re-render
    }
  }
}
```

This security model makes `reflectx` suitable for applications handling user-generated content while maintaining the flexibility of a templating engine.

### Security Audit Summary

reflectx has been designed and audited to ensure maximum security for web applications:

#### Core Engine Security

**No Dangerous Functions**
- ✓ No `eval()` or `Function()` constructor used
- ✓ No `innerHTML` for dynamic content
- ✓ No `outerHTML` manipulation
- ✓ No `document.write()`

**Safe Content Rendering**
- ✓ All dynamic content uses `textContent` (auto-escapes HTML)
- ✓ User input like `<script>alert('XSS')</script>` is rendered as escaped text, never executed
- ✓ Plugin outputs are also rendered via `textContent`

**Sandboxed Expression Evaluator**
- ✓ Custom parser with whitelisted globals only
- ✓ Allowed: `Math`, `Date`, `Number`, `String`, `Boolean`, `JSON`, `Array`, `parseInt`, `parseFloat`, `isFinite`
- ✗ Blocked: `window`, `document`, `eval`, `fetch`, `XMLHttpRequest`, `localStorage`, `location`

**Safe Template Processing**
- ✓ Templates use `.content` property (no innerHTML)
- ✓ Event handlers use sandboxed evaluator (no string-to-function conversion)

#### Plugin System Security

**Framework Security ✓**
- ✓ Plugin output automatically escaped via `textContent`
- ✓ Plugin execution wrapped in try-catch for graceful error handling
- ✓ Plugins cannot access dangerous globals

**Developer Responsibility ⚠️**

Plugin developers **must validate and sanitize** all inputs in their `execute()` method:

```js
// ✓ SECURE: Properly validated plugin
export const securePlugin = {
  name: 'format',
  
  execute(value, options = {}) {
    // 1. Type validation
    if (typeof value !== 'string') {
      console.warn('Invalid input type, expected string');
      return '';
    }
    
    // 2. Length validation
    if (value.length > 10000) {
      console.warn('Input too long');
      return value.substring(0, 10000);
    }
    
    // 3. Sanitization (if needed for your use case)
    const sanitized = value.replace(/[<>&"']/g, char => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;',
      '"': '&quot;', "'": '&#39;'
    })[char]);
    
    // 4. Safe processing
    return sanitized.toUpperCase();
  }
};

// ✗ INSECURE: No validation
export const insecurePlugin = {
  name: 'unsafe',
  execute(value) {
    // Dangerous: No type checking, no validation
    return value.toUpperCase(); // Crashes if value is not a string
  }
};
```

**Plugin Security Checklist**

When creating plugins, ensure you:

1. ✓ **Validate input types** - Check `typeof` before processing
2. ✓ **Validate input length** - Prevent resource exhaustion
3. ✓ **Sanitize if needed** - Escape special characters for your use case
4. ✓ **Handle errors gracefully** - Use try-catch to prevent crashes
5. ✓ **Return safe values** - Always return strings or values that convert to string
6. ✓ **Document requirements** - Clearly document expected input types and formats
7. ✓ **Avoid DOM manipulation** - Minimize direct DOM changes outside the element
8. ✓ **Test with malicious input** - Test with XSS payloads, large inputs, invalid types

#### Security Guarantees

| Feature | Core Engine | Plugin System |
|---------|-------------|---------------|
| XSS Prevention | ✓ Guaranteed | ✓ Framework protected, ⚠️ validate inputs |
| Code Injection | ✓ Blocked | ✓ Blocked |
| HTML Escaping | ✓ Automatic | ✓ Automatic |
| Global Access | ✓ Whitelisted only | ✓ Whitelisted only |
| Expression Safety | ✓ Sandboxed | ✓ Sandboxed |
| Input Validation | ✓ Type-checked | ⚠️ Developer responsibility |

`reflectx` provides a **secure foundation** for web applications. The core engine is hardened against XSS and code injection attacks. Plugin developers must follow security best practices and validate all inputs to maintain the security guarantee.

## Browser Support

reflectx works in all modern browsers that support:

- **ES6+** (Proxy, template literals, modules)
- **Custom Elements** (for Web Components usage)
- **`<template>`** element

Tested on: Chrome, Firefox, Safari, Edge (evergreen).

## Known Limitations

- **Manual re-renders** — Call `reflectx(state, element)` after state changes unless using a reactive state library
- **Event handlers** — Both `@click="openRoot"` and `@click="openRoot()"` work; the function is auto-invoked when the expression evaluates to a function
- **Private fields** — Event handlers receive the real component as `this`, so private fields (`#path`) work in methods
- **DOM replacement** — `x-for` without `x-key` replaces nodes on each render; use `x-key` for optimal performance and to preserve DOM state

## Contributing

Contributions are welcome. Please open an issue or submit a pull request on [GitHub](https://github.com/ynck-chrl/reflectx).

## License

`reflectx` is licensed under the [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/).

- ✅ Personal projects, hobby use, education, research, non-profits
- ❌ Commercial / revenue-generating use requires a separate license

See [LICENSE](./LICENSE) for full terms.

**For commercial licensing inquiries:** info@nativelayer.dev
