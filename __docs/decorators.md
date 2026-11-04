# JavaScript Decorators

A **decorator** in JavaScript is a function that wraps or modifies another thing — usually a **class**, **method**, **getter/setter**, **field**, or **function** — at **definition time**.

Think of it as: *“when this class/method is declared, run this wrapper first.”*

Decorators use the `@` syntax and are a **TC39 Stage 3** feature. They are supported in modern browsers and TypeScript 5.0+ (standard decorators, not legacy `experimentalDecorators`).

---

## How decorators work

A decorator receives `(value, context)` and returns a replacement (or the original):

```js
function myDecorator(value, context) {
  console.log(context.kind)   // 'class' | 'method' | 'getter' | 'setter' | 'field' | 'accessor'
  console.log(context.name)   // 'User', 'greet', 'count', …
  console.log(context.static) // true if static member
  return value                // or a wrapped replacement
}
```

Decorators run **once**, when the class is evaluated — not on every call.

---

## What can be decorated

### Class

Wrap or replace an entire class at definition time.

```js
function sealed(Original) {
  return class extends Original {
    constructor(...args) {
      super(...args)
      Object.seal(this)
    }
  }
}

function logged(Original, context) {
  console.log(`defining class: ${context.name}`)
  return Original
}

@logged
@sealed
class User {
  constructor(name) {
    this.name = name
  }
}

const u = new User('Ada')
u.name = 'Grace' // silently fails — instance is sealed
```

---

### Method

Wrap a method to run logic before/after (or instead of) the original.

```js
function trace(original, context) {
  return function (...args) {
    console.log(`→ ${context.name}(${args.join(', ')})`)
    const result = original.call(this, ...args)
    console.log(`← ${context.name} →`, result)
    return result
  }
}

class Calculator {
  @trace
  add(a, b) {
    return a + b
  }
}

new Calculator().add(2, 3)
// → add(2, 3)
// ← add → 5
```

---

### Getter / setter

Intercept reads and writes on a property.

```js
function validate(min, max) {
  return (original, context) => {
    if (context.kind === 'setter') {
      return function (value) {
        if (value < min || value > max) {
          throw new RangeError(`${context.name} must be between ${min} and ${max}`)
        }
        return original.call(this, value)
      }
    }
    return original
  }
}

class Thermostat {
  #temp = 20

  @validate(0, 40)
  set temperature(value) {
    this.#temp = value
  }

  get temperature() {
    return this.#temp
  }
}

const t = new Thermostat()
t.temperature = 25  // ok
t.temperature = 100 // RangeError
```

Using a class **accessor** (modern shorthand for get + set):

```js
function uppercase(_initialValue, context) {
  let value = ''

  return {
    get() { return value },
    set(v) { value = String(v).toUpperCase() },
    init(initial) { value = String(initial).toUpperCase() },
  }
}

class Profile {
  @uppercase accessor username = 'guest'
}

const p = new Profile()
p.username = 'ada'
console.log(p.username) // 'ADA'
```

---

### Class field

Run logic when a field is initialized, or replace the field with an accessor.

```js
function persist(key) {
  return (initialValue, context) => {
    const storageKey = `${context.name}.${key}`

    return {
      get() {
        const stored = localStorage.getItem(storageKey)
        return stored !== null ? JSON.parse(stored) : initialValue
      },
      set(value) {
        localStorage.setItem(storageKey, JSON.stringify(value))
      },
      init(initial) {
        const stored = localStorage.getItem(storageKey)
        return stored !== null ? JSON.parse(stored) : initial
      },
    }
  }
}

class Settings {
  @persist('theme') theme = 'dark'
}

const s = new Settings()
s.theme = 'light' // saved to localStorage
```

Simple field initializer wrapper:

```js
function readonly(value, context) {
  context.addInitializer(function () {
    Object.defineProperty(this, context.name, {
      writable: false,
      configurable: false,
      value: this[context.name],
    })
  })
  return value
}

class Config {
  @readonly version = '1.0.0'
}

const c = new Config()
c.version = '2.0.0' // fails silently in strict mode, throws in sloppy assignment contexts
```

---

### Private method / field

Same syntax — decorators work on private members too.

```js
function tracePrivate(original, context) {
  return function (...args) {
    console.log(`[private] ${String(context.name)} called`)
    return original.call(this, ...args)
  }
}

class Vault {
  #secret = 'hidden'

  @tracePrivate
  #decrypt(key) {
    return this.#secret
  }

  reveal(key) {
    return this.#decrypt(key)
  }
}

new Vault().reveal('abc')
// [private] #decrypt called
```

```js
function clamp(min, max) {
  return (initial, context) => ({
    get() { return this[`__${context.name}`] },
    set(v) { this[`__${context.name}`] = Math.min(max, Math.max(min, v)) },
    init(v) { return Math.min(max, Math.max(min, v)) },
  })
}

class Slider {
  @clamp(0, 100) #value = 50
}
```

---

## Use cases

### Logging / tracing

Log every method call with timing:

```js
function timing(original, context) {
  return async function (...args) {
    const start = performance.now()
    const result = await original.apply(this, args)
    console.log(`${context.name} took ${(performance.now() - start).toFixed(1)}ms`)
    return result
  }
}

class Api {
  @timing
  async fetchUsers() {
    return fetch('/api/users').then(r => r.json())
  }
}
```

---

### Validation

Check arguments before a method runs:

```js
function requireArgs(...names) {
  return (original, context) => function (...args) {
    names.forEach((name, i) => {
      if (args[i] == null) throw new TypeError(`${context.name}(): missing argument "${name}"`)
    })
    return original.apply(this, args)
  }
}

class Mailer {
  @requireArgs('to', 'subject', 'body')
  send(to, subject, body) {
    console.log(`Sending to ${to}: ${subject}`)
  }
}

new Mailer().send('ada@example.com', 'Hi') // TypeError
```

---

### Authorization

Restrict a method to users with a given role:

```js
function requireRole(role) {
  return (original, context) => function (...args) {
    if (this.currentUser?.role !== role) {
      throw new Error(`Forbidden: ${context.name} requires role "${role}"`)
    }
    return original.apply(this, args)
  }
}

class AdminPanel {
  currentUser = { name: 'Ada', role: 'editor' }

  @requireRole('admin')
  deleteUser(id) {
    console.log(`Deleted user ${id}`)
  }
}

new AdminPanel().deleteUser(42) // Error: Forbidden
```

---

### Caching / memoization

Cache method results by serialized arguments:

```js
function memoize(original, context) {
  const cache = new Map()

  return function (...args) {
    const key = JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)
    const result = original.apply(this, args)
    cache.set(key, result)
    return result
  }
}

class MathService {
  @memoize
  fibonacci(n) {
    if (n <= 1) return n
    return this.fibonacci(n - 1) + this.fibonacci(n - 2)
  }
}

const m = new MathService()
m.fibonacci(40) // first call: slow
m.fibonacci(40) // second call: instant (cached)
```

---

### Binding — auto-bind `this`

Ensure a method always runs with the correct `this`, even when passed as a callback:

```js
function bind(_original, context) {
  context.addInitializer(function () {
    this[context.name] = this[context.name].bind(this)
  })
}

class Button {
  label = 'Click me'

  @bind
  handleClick() {
    console.log(this.label)
  }
}

const btn = new Button()
const fn = btn.handleClick
fn() // 'Click me' — still bound
```

---

### Framework metadata (routing, serialization)

Decorators are often used to attach metadata that a framework reads later:

```js
const routes = new Map()

function route(path) {
  return (original, context) => {
    routes.set(path, { handler: original, name: context.name })
    return original
  }
}

function json(_original, context) {
  context.addInitializer(function () {
    this[`__serialize_${context.name}`] = true
  })
}

class UserController {
  @route('/users')
  @json
  list() {
    return [{ id: 1, name: 'Ada' }]
  }

  @route('/users/:id')
  show(id) {
    return { id, name: 'Ada' }
  }
}

console.log([...routes.entries()])
// ['/users', { handler: [Function], name: 'list' }]
// ['/users/:id', { handler: [Function], name: 'show' }]
```

This is the same pattern Angular, Lit, and others use: decorators declare intent; the framework wires things up at bootstrap.

---

## Cross-cutting concerns

Cross-cutting concerns are behaviors that span many classes/methods (logging, auth, validation) without belonging in any single one. Decorators keep that logic **DRY** and **declarative**:

```js
function audit(action) {
  return (original, context) => function (...args) {
    const user = this.currentUser?.name ?? 'anonymous'
    console.log(`[AUDIT] ${user} → ${action ?? context.name}`, args)
    return original.apply(this, args)
  }
}

class Orders {
  currentUser = { name: 'Ada' }

  @audit('order.create')
  create(item) { return { id: 1, item } }

  @audit('order.cancel')
  cancel(id) { return { id, status: 'cancelled' } }
}
```

Instead of repeating audit logic inside every method, one decorator handles it everywhere.

---

## Decorator factories

When a decorator needs configuration, return a decorator from a function:

```js
function debounce(ms) {
  return (original, context) => {
    let timer
    return function (...args) {
      clearTimeout(timer)
      timer = setTimeout(() => original.apply(this, args), ms)
    }
  }
}

class Search {
  @debounce(300)
  onInput(query) {
    console.log('searching:', query)
  }
}
```

Usage: `@debounce(300)` → factory returns the actual decorator.

---

## When to use decorators

**Good for:**

- Cross-cutting concerns (logging, auth, validation)
- Framework metadata (routing, serialization)
- DRY wrapping of many methods/classes

**Skip when:**

- The logic applies to one method only — inline code is clearer
- You need broad support in older environments without transpilation
- The team is unfamiliar with the syntax and debugging wrapped functions

---

## Manual equivalent (no `@` syntax)

Decorators are syntactic sugar. This:

```js
class User {
  @trace
  greet() { return 'hello' }
}
```

Is conceptually similar to:

```js
class User {
  greet() { return 'hello' }
}
{
  const desc = Object.getOwnPropertyDescriptor(User.prototype, 'greet')
  Object.defineProperty(User.prototype, 'greet', {
    ...desc,
    value: trace(desc.value, { kind: 'method', name: 'greet' }),
  })
}
```

The `@` syntax just makes this pattern readable at the declaration site.

---

## Further reading

- [TC39 Decorators proposal](https://github.com/tc39/proposal-decorators)
- [MDN: Decorators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Decorators)
- [TypeScript 5.0 decorators](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#decorators)
