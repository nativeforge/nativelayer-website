# Template Literals: The JavaScript Feature You Think You Know

Every developer has written `` `Hello, ${name}` ``. Almost nobody has pushed template literals to where they actually shine: tagged templates, raw strings, compile-time DSLs, safe HTML boundaries, and the quiet replacement for half your utility layer.

This is a deep dive — not a syntax refresher. What they are, what problems they solve, the abilities people skip, the edge cases that bite, and the surprising things a backtick string can do when you stop treating it as fancy concatenation.

## What Template Literals Actually Are

Introduced in ES2015, a **template literal** is a string delimiter using backticks instead of quotes:

```js
const single = 'hello';
const double = "hello";
const template = `hello`;
```

Two features distinguish them from string literals:

1. **Interpolation** — `${expression}` embeds any JavaScript value
2. **Multiline** — line breaks are literal; no `\n` escape required

```js
const user = { name: 'Ada', role: 'engineer' };

const greeting = `Hi ${user.name},
you are logged in as ${user.role}.`;

console.log(greeting);
// Hi Ada,
// you are logged in as engineer.
```

Under the hood, the engine does **not** simple concatenation. It builds an array of string parts and an array of evaluated expressions, then assembles the result. That structure is what makes **tagged templates** possible — and that's where the real power lives.

## The Problem They Were Built to Solve

### String concatenation hell

Before template literals, dynamic strings looked like this:

```js
// The old way
const url = base + '/users/' + id + '/posts?page=' + page + '&sort=' + sort;

const html = '<div class="card">' +
  '<h2>' + escape(title) + '</h2>' +
  '<p>' + escape(body) + '</p>' +
  '</div>';
```

Readable? Barely. Safe? Only if you remembered `escape()` everywhere. Maintainable? No.

```js
// Template literal equivalent
const url = `${base}/users/${id}/posts?page=${page}&sort=${sort}`;

const html = `
  <div class="card">
    <h2>${escape(title)}</h2>
    <p>${escape(body)}</p>
  </div>
`;
```

Same logic. Fewer bugs from missed `+` operators. Whitespace you control.

### Multiline without escape gymnastics

```js
// Old
const query = 'SELECT id, name\n' +
              'FROM users\n' +
              'WHERE active = 1';

// New
const query = `
  SELECT id, name
  FROM users
  WHERE active = 1
`;
```

SQL, GraphQL, SVG snippets, shell scripts, test fixtures — anything multiline becomes copy-pasteable from docs without `\n` noise.

### Embedded expressions, not just variables

Anything valid after `${` works:

```js
const items = ['routerx', 'restate', 'reflectx'];

const list = `
  <ul>
    ${items.map(item => `<li>${item}</li>`).join('')}
  </ul>
`;
```

```js
const price = 19.99;
const label = `Total: ${price.toFixed(2)} ${currency ?? 'USD'}`;
```

```js
const status = `User is ${isAdmin ? 'admin' : 'guest'}`;
```

Template literals are a **host language** for mini-templates inside JavaScript. That framing matters later.

## The Overlooked Abilities

### 1. Tagged template functions

A **tag function** intercepts the template before it becomes a string:

```js
function tag(strings, ...values) {
  console.log('strings:', strings); // array of literal parts
  console.log('values:', values);   // array of interpolated expressions
  return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
}

const name = 'world';
tag`Hello ${name}!`;
// strings: ['Hello ', '!']
// values: ['world']
```

The tag receives:
- `strings` — a **frozen array** of raw string segments (with a `.raw` property)
- `values` — evaluated expressions, one per `${}`

This is not sugar. It's a **custom compile hook** for embedded languages.

```js
function sql(strings, ...values) {
  let query = '';
  const params = [];

  strings.forEach((str, i) => {
    query += str;
    if (i < values.length) {
      query += `$${i + 1}`;
      params.push(values[i]);
    }
  });

  return { text: query, values: params };
}

const id = 42;
const status = 'active';

const { text, values } = sql`
  SELECT * FROM users
  WHERE id = ${id}
    AND status = ${status}
`;

// text:  'SELECT * FROM users WHERE id = $1 AND status = $2'
// values: [42, 'active']
```

You just built a parameterized query builder in 12 lines. No ORM. No string injection.

### 2. `String.raw` — the built-in tag

Every template literal's `strings` array has a `.raw` property with unescaped content:

```js
const path = String.raw`C:\Users\Ada\projects\nativelayer`;
// C:\Users\Ada\projects\nativelayer  — backslashes preserved

const normal = `C:\Users\Ada\projects\nativelayer`;
// C:UsersAdaprojectsativelayer  — \U \A \p \n eaten as escapes
```

Use `String.raw` for:
- Windows paths
- Regex patterns
- LaTeX, Graphviz DOT, escape-heavy formats

```js
const regex = String.raw`\d+\.\d+`; // \d stays literal until RegExp parses it
new RegExp(regex).test('3.14'); // true
```

### 3. Nested template literals

Templates compose:

```js
const icon = (name) => `<svg class="icon icon-${name}"></svg>`;

const button = (label, iconName) => `
  <button type="button">
    ${icon(iconName)}
    <span>${label}</span>
  </button>
`;

button('Save', 'check');
```

```js
const rows = users.map(u => `
  <tr>
    <td>${u.id}</td>
    <td>${u.name}</td>
  </tr>
`).join('');

const table = `
  <table>
    <tbody>${rows}</tbody>
  </table>
`;
```

This is how `reflectx` and hand-rolled Web Components often start — before you graduate to template-element clones or tagged `html` sanitizers.

### 4. Indentation trimming (the pattern everyone reinvents)

Template literals preserve your source indentation:

```js
function dedent(strings, ...values) {
  const raw = String.raw({ raw: strings }, ...values);
  const lines = raw.replace(/^\n/, '').split('\n');
  const indent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^(\s*)/)[1].length));
  return lines.map(l => l.slice(indent)).join('\n').trim();
}

const css = dedent`
  .card {
    padding: 1rem;
    border: 1px solid #ccc;
  }
`;
```

Libraries like `dedent` (npm) exist because this pattern is universal. Tagged templates make it a one-liner import.

### 5. Internationalization (Intl) and template tags

The `Intl` API pairs naturally with tagged templates:

```js
const translations = {
  en: { greeting: 'Hello, {name}! You have {count} messages.' },
  fr: { greeting: 'Bonjour, {name} ! Vous avez {count} messages.' },
};

function i18n(strings, ...values) {
  const locale = document.documentElement.lang || 'en';
  const key = strings.join('{?}'); // simplified lookup key
  let template = translations[locale]?.greeting ?? strings.raw.join('');
  values.forEach((v, i) => {
    template = template.replace(`{${Object.keys({ name: 1, count: 1 })[i]}}`, v);
  });
  return template;
}

// Production code uses libraries like @formatjs/intl or i18next with proper ICU syntax
```

The ECMAScript proposal for **Intl message formatting** explicitly contemplates template-tag-shaped APIs. The mental model: templates are message slots; tags are locale processors.

## Problems They Help You Solve (Beyond Strings)

| Problem | Without templates | With templates |
|---|---|---|
| SQL injection | Manual `$1, $2` indexing | Tagged `sql` builder |
| XSS in HTML | Forgotten `escape()` | Tagged `html` with auto-escape |
| CSS-in-JS | Runtime object parsing | Tagged `css` → stylesheet |
| GraphQL | `.gql` file loader + webpack | Tagged `gql` → AST |
| Styled components | Babel plugin | Tagged `styled` → class names |
| Test snapshots | `expect(x).toBe('...')` | Tagged snapshot matchers |

### Styled output: the `css` tag pattern

```js
function css(strings, ...values) {
  const sheet = css._sheet ??= new CSSStyleSheet();
  const rule = strings.reduce((acc, s, i) => acc + s + (values[i] ?? ''), '');
  sheet.replaceSync(rule);
  return sheet;
}

css._sheet = null;

// Usage (conceptual — real css-tag libs handle scoping)
const theme = '220 100% 50%';
css`
  :host {
    --accent: hsl(${theme});
    color: hsl(var(--accent));
  }
`;
```

Constructable Stylesheets + tagged templates = Web Components styling without a build step.

### Safe HTML: the pattern React popularized, native JS can do

```js
const escapeHtml = (str) => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function html(strings, ...values) {
  return strings.reduce((acc, str, i) => {
    const val = values[i];
    const safe = val == null ? '' : escapeHtml(val);
    return acc + str + (i < values.length ? safe : '');
  }, '');
}

const userInput = '<script>alert(1)</script>';
const snippet = html`<p>Comment: ${userInput}</p>`;
// <p>Comment: &lt;script&gt;alert(1)&lt;/script&gt;</p>
```

Lit's `html` tag, uhtml, and dozens of micro-libraries are this idea with smarter diffing. The insight: **the tag is the security boundary**, not the backticks.

## Edge Cases That Bite

### Automatic semicolon insertion (ASI) and leading expressions

```js
const x = 1;

// SyntaxError — JS thinks `tag` is being called on the previous line's value
const y = 2
tag`hello`;

// Fix: semicolon or void
const y = 2;
tag`hello`;
```

Any template literal starting a statement after an expression statement needs a defensive semicolon on the line above. Linters enforce this for a reason.

### `${undefined}` and `${null}`

```js
`${undefined}` // 'undefined'  — string, not empty
`${null}`      // 'null'
`${false}`     // 'false'
`${0}`         // '0'
```

For UI, often wrong:

```js
// Bug: shows "undefined" in the DOM
`<span>${user.middleName}</span>`

// Fix
`<span>${user.middleName ?? ''}</span>`
```

### Objects stringify to `[object Object]`

```js
const user = { name: 'Ada' };
`User: ${user}`; // 'User: [object Object]'
```

Always drill into properties or serialize explicitly:

```js
`User: ${user.name}`;
`User: ${JSON.stringify(user)}`; // rarely what you want in UI
```

### Whitespace is part of the value

```js
const x = `
  hello
`;
// '\n  hello\n'  — leading newline + indentation + trailing newline

x.trim(); // usually what you wanted
```

For HTML templates, indentation becomes text nodes in some parsers. Trim consciously or use a dedent tag.

### Escape sequences: raw vs cooked

```js
`\\n`   // '\\n' — backslash + n (two chars)
`\n`    // newline (one char)
String.raw`\n` // '\\n' — two chars
```

The `strings` array in tags has both `.raw` (uncooked) and cooked versions. Security-sensitive tags should prefer `.raw` when building regex or paths.

### Tag functions run on **every** call — no memoization by default

```js
function expensive(strings, ...values) {
  console.log('recomputed');
  return 'done';
}

expensive`a ${1} b`;
expensive`a ${1} b`; // logs twice — new array identity each time
```

If your tag compiles to CSS or SQL, add caching keyed on `strings.raw`:

```js
function memoizedTag(fn) {
  const cache = new Map();
  return (strings, ...values) => {
    const key = strings.raw.join('\0');
    if (!cache.has(key)) cache.set(key, fn(strings, ...values));
    return cache.get(key);
  };
}
```

### Tagged templates and TypeScript

TypeScript types tagged templates via **template literal types** (a different but related feature):

```ts
type Route = `/users/${string}` | `/posts/${string}`;

function navigate(path: Route) { /* ... */ }

navigate('/users/42');   // ok
navigate('/admin/secret'); // type error
```

Runtime tags + compile-time literal types = typed URL builders, CSS property validators, and SQL column whitelists.

## What Developers Ignore

### 1. They're a compile target, not a string type

The moment you write a tag function, you're writing a **compiler frontend**. The template literal is source code; the tag is the compiler. Frameworks (GraphQL, gql; Styled Components, css; Lit, html) are proof.

If you're building a DSL for your app — config files, permission rules, form schemas — a tagged template is often simpler than JSON + validator + parser.

### 2. `String.raw` exists and is free

Most codebases use double backslashes in regex strings and wonder why patterns fail. `String.raw` is built in. Use it.

### 3. The `strings` array is frozen and has `.raw`

```js
function inspect(strings, ...values) {
  console.log(Object.isFrozen(strings)); // true
  console.log(strings.raw);              // uncooked segments
}
```

Tags that transform markdown, MDX, or custom markup should read `.raw` when escape semantics matter.

### 4. You can return non-strings

Tag functions can return anything:

```js
function createElement(strings, ...values) {
  const type = strings[0].trim();
  const el = document.createElement(type);
  // ... bind values to attributes
  return el;
}
```

Lit returns `TemplateResult` objects, not strings. Your tag can return DOM nodes, ASTs, React elements, or SQL query objects.

### 5. Partial application of tags

```js
const bold = (strings, ...values) =>
  `<strong>${strings.reduce((a, s, i) => a + s + (values[i] ?? ''), '')}</strong>`;

const name = 'Ada';
const html = bold`${name}`; // <strong>Ada</strong>
```

Tags are functions. Compose them.

## The Surprising Things They Can Do

### 1. Runtime CSS `@property` injection

```js
function registerProp(name, syntax, inherits = false) {
  const rule = `@property ${name} { syntax: '${syntax}'; inherits: ${inherits}; initial-value: 0; }`;
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(rule);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
}

registerProp('--card-shine', '<color>');
// Now you can transition custom properties that weren't transitionable before
```

Pair with a tag that emits `@property` blocks from design tokens:

```js
const token = (name, val) => `--${name}: ${val};`;

const vars = (strings, ...values) => `:root { ${strings.reduce((a, s, i) => a + s + (values[i] ?? ''), '')} }`;

const cssText = vars`
  ${token('accent', 'hsl(220 100% 50%)')}
  ${token('space', '0.5rem')}
`;
```

### 2. Shell command builder with argument escaping

```js
function sh(strings, ...values) {
  const escape = (v) => `'${String(v).replace(/'/g, `'\\''`)}'`;
  return strings.reduce((acc, s, i) => acc + s + (i < values.length ? escape(values[i]) : ''), '');
}

const branch = 'feature/template-literals';
const cmd = sh`git checkout -b ${branch}`;
// git checkout -b 'feature/template-literals'
```

No shell injection. Same pattern as Python's `shlex`.

### 3. Permission rules as readable code

```js
const allow = (strings, ...values) => {
  const rule = strings.reduce((a, s, i) => a + s + (values[i] ?? ''), '');
  return { rule, allowed: evaluate(rule) };
};

// Conceptual — rule engine parses the string
allow`user.role === 'admin' && resource.ownerId === ${userId}`;
```

Policy-as-code reads like code because it **is** code — interpolated safely.

### 4. Benchmark fixtures without concatenation drift

```js
const fixture = (n) => String.raw`
  ${Array.from({ length: n }, (_, i) => `<item id="${i}">text</item>`).join('\n')}
`;

document.body.innerHTML = `<root>${fixture(1000)}</root>`;
```

### 5. `Function` constructor alternative (with caveats)

```js
const makeValidator = (fields) => new Function('data', `
  return ${fields.map(f => `data.${f} != null`).join(' && ')};
`);

makeValidator(['name', 'email'])(({ name: 'Ada', email: 'a@b.c' })); // true
```

Template literals make dynamic code generation readable. **Security warning:** never interpolate untrusted input into `new Function` or `eval`. This pattern is for closed schemas you control.

### 6. Custom elements `observedAttributes` from a schema tag

```js
function defineAttrs(strings, ...values) {
  return strings.reduce((a, s, i) => a + s + (values[i] ?? ''), '')
    .split(/[\s,]+/)
    .filter(Boolean);
}

class MyElement extends HTMLElement {
  static observedAttributes = defineAttrs`
    variant
    size
    disabled
  `;
}
```

Declarative metadata. Zero duplication between docs and implementation.

## My Take: Where Template Literals Fit in 2026

Template literals are the **most underused extensibility point in JavaScript**. We treat them as string quotes with superpowers, then reach for Babel plugins, webpack loaders, and 40 KB templating libraries to solve problems tags already solve natively.

The progression I recommend:

1. **Plain templates** — config, URLs, logging, multiline strings
2. **Tagged escape boundary** — one `html` or `sql` tag for your app's injection surface
3. **`<template>` + clone** — when structure is DOM-heavy (see the companion post on `<template>`)
4. **Compile-time types** — TypeScript template literal types on top of runtime tags for routes, CSS props, event names

What I'd stop doing:

- Building strings with `+` in 2026
- Using `` `...${userInput}...` `` in HTML without a tag or explicit escape
- Ignoring `String.raw` for paths and regex
- Assuming `` `${obj}` `` does something useful

What I'd start doing:

- One shared `html` tag (even 10 lines) across the codebase
- Tagged SQL/GraphQL if you touch the database from JS
- Template literal types for internal route and API path constants
- Treating every tag function as a **small compiler** — because that's what it is

The surprising thing? Template literals were sold as "multiline strings with interpolation." They're actually **JavaScript's user-definable string compiler hook** — and almost nobody told us.

---

*Posted in* **FIELD NOTE** · *July 2026*
