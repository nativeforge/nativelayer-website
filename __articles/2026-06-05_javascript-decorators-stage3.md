# JavaScript Decorators at Stage 3: What You Need to Know

After nearly a decade in the TC39 proposal pipeline, JavaScript decorators are at Stage 3, meaning the syntax and semantics are stable, transpiler support is solid, and native browser implementation is underway. Here's a practical guide to the current spec.

## What Decorators Are

A decorator is a function applied to a class, method, getter, setter, or field at definition time. It can replace, wrap, or augment the decorated target.

```js
function log(originalMethod, context) {
  return function (...args) {
    console.log(`Calling ${context.name} with`, args);
    const result = originalMethod.apply(this, args);
    console.log(`${context.name} returned`, result);
    return result;
  };
}

class UserService {
  @log
  getUser(id) {
    return { id, name: 'Ada' };
  }
}
```

## The Context Object

Every decorator receives `(value, context)`. The context object is rich:

```js
function describe(value, context) {
  console.log({
    kind: context.kind,       // 'class' | 'method' | 'field' | 'getter' | 'setter' | 'accessor'
    name: context.name,       // 'UserService' | 'getUser' | ...
    static: context.static,   // true for static members
    private: context.private, // true for #privateFields
    addInitializer: context.addInitializer, // register code to run on instance creation
  });
  return value;
}
```

## Class Decorators

```js
function singleton(Class) {
  let instance;
  return class extends Class {
    constructor(...args) {
      if (instance) return instance;
      super(...args);
      instance = this;
    }
  };
}

@singleton
class Config {
  constructor() {
    this.env = 'production';
  }
}

new Config() === new Config() // true
```

## Field Decorators with `accessor`

The new `accessor` keyword creates a getter/setter pair that decorators can intercept:

```js
function clamp(min, max) {
  return function (_, context) {
    return {
      get() { return this[`__${context.name}`]; },
      set(value) {
        this[`__${context.name}`] = Math.min(max, Math.max(min, value));
      },
      init(initialValue) {
        return Math.min(max, Math.max(min, initialValue));
      }
    };
  };
}

class Slider {
  @clamp(0, 100) accessor value = 50;
}

const s = new Slider();
s.value = 150;
console.log(s.value); // 100
```

## `addInitializer` for Instance Setup

```js
function autoBind(method, context) {
  context.addInitializer(function () {
    this[context.name] = this[context.name].bind(this);
  });
}

class Button {
  @autoBind
  handleClick() {
    console.log(this.label); // 'this' is always the Button instance
  }
}
```

## Difference from TypeScript Legacy Decorators

The Stage 3 decorators are **not compatible** with TypeScript's `experimentalDecorators`. TypeScript 5.0+ uses the standard spec when `experimentalDecorators` is `false` (the new default). The two systems have different decorator signature shapes and different `accessor` semantics.

## Current Tooling Support

- **TypeScript 5.0+**: full support (standard decorators)
- **Babel**: `@babel/plugin-proposal-decorators` with `version: '2023-11'`
- **esbuild/Vite**: via Babel transforms
- **Native browser**: Chrome and Edge are implementing; Firefox and Safari in progress

---

*Posted in* **PIPELINE** · *June 2026*
