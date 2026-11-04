# Custom Elements v2: What's New in the Spec

The Web Components specifications continue to evolve. Here's what's new or recently stabilized in the Custom Elements spec, and what it means for component authors.

## Form-Associated Custom Elements

Custom elements can now participate in forms natively, something that previously required hidden `<input>` elements as proxies:

```js
class StarRating extends HTMLElement {
  static formAssociated = true;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open' });
  }

  get value() { return this.#value; }

  set value(v) {
    this.#value = v;
    // Set the value that the form sees
    this.#internals.setFormValue(String(v));
    // Optionally set validity
    if (!v) {
      this.#internals.setValidity(
        { valueMissing: true },
        'Please select a rating',
        this.shadowRoot.querySelector('input')
      );
    } else {
      this.#internals.setValidity({});
    }
  }
}
```

The `ElementInternals` object is the key: it connects the custom element to the form system, providing `setFormValue()`, `setValidity()`, `setCustomValidity()`, and access to form-related events.

## `ElementInternals` and ARIA

The same `attachInternals()` call gives access to ARIA property setters:

```js
this.#internals.ariaLabel = 'Star rating: 3 out of 5';
this.#internals.ariaValueNow = '3';
this.#internals.ariaValueMin = '1';
this.#internals.ariaValueMax = '5';
this.#internals.role = 'slider';
```

This bypasses the accessibility shadow DOM isolation problem. Previously, `aria-*` attributes on the host were often not correctly associated with shadow DOM content.

## Custom State Pseudo-Classes

Custom elements can define their own CSS pseudo-classes via `ElementInternals`:

```js
// In the component
#internals.states.add('loading');
#internals.states.delete('loading');
```

```css
/* From outside the component */
my-element:state(loading) {
  opacity: 0.5;
  cursor: wait;
}

/* From inside the shadow DOM */
:host:state(loading) {
  pointer-events: none;
}
```

This is the missing link for component state communication via CSS: things like `:checked`, `:disabled`, `:invalid` are built-in states; `CustomStateSet` lets you create equivalents.

## `customElements.upgrade()`

Force synchronous upgrade of an element:

```js
const el = document.createElement('my-component');
// At this point, el is HTMLElement (not yet upgraded if not defined)
customElements.upgrade(el);
// Now el is the custom element class instance
el.myProperty = value; // safe to use before connecting to DOM
```

## `whenDefined()` Returns the Constructor

```js
const MyElement = await customElements.whenDefined('my-element');
// MyElement is the class, not just a resolved promise
const instance = new MyElement();
```

## `--part()` and `::theme()`: On the Horizon

The CSS `::part()` pseudo-element is now well-supported and stable: style shadow DOM internals from outside:

```html
<my-card>
  <shadow: button part="action-btn">Click</button>
</my-card>
```

```css
my-card::part(action-btn) {
  background: hsl(var(--accent));
}
```

The proposed `::theme()` pseudo-element would let you style any element with a given `exportparts` name across the entire document: think global design tokens at the component part level. Still in early proposal stage.

---

*Posted in* **PIPELINE** · *May 2026*
