# The Popover API: Native Overlays Without JavaScript

The HTML Popover API landed in all major browsers in 2024, providing a declarative, accessible, keyboard-navigable overlay system as a first-class platform feature: no JavaScript required for the basic use case.

## The Basics

```html
<button popovertarget="my-popover">Open</button>

<div id="my-popover" popover>
  <p>I'm a native popover. Press Escape to close me.</p>
  <button popovertarget="my-popover" popovertargetaction="hide">Close</button>
</div>
```

The browser handles:
- Toggle behavior (open/close via button)
- Escape key dismissal
- Light-dismiss (click outside to close)
- Focus management (focus moves into the popover on open)
- Top-layer rendering (no z-index battles)

## `popover` Types

```html
<!-- auto: light-dismiss, only one open at a time, Escape closes -->
<div popover="auto" id="tooltip">Auto popover</div>

<!-- manual: no light-dismiss, stays open until explicitly closed -->
<div popover="manual" id="drawer">Manual popover</div>
```

`auto` popovers form a stack: opening a new one closes unrelated open ones. `manual` requires explicit JavaScript control.

## The `:popover-open` Pseudo-Class

```css
[popover] {
  opacity: 0;
  transform: translateY(-1rem);
  transition: opacity 0.2s, transform 0.2s, overlay 0.2s allow-discrete, display 0.2s allow-discrete;
}

[popover]:popover-open {
  opacity: 1;
  transform: translateY(0);
}

@starting-style {
  [popover]:popover-open {
    opacity: 0;
    transform: translateY(-1rem);
  }
}
```

The `@starting-style` block defines the initial state for the enter animation. `allow-discrete` on `display` and `overlay` enables animating the popover from/to `display: none`.

## JavaScript API

```js
const popover = document.getElementById('my-popover');

popover.showPopover();
popover.hidePopover();
popover.togglePopover();

// Events
popover.addEventListener('beforetoggle', (e) => {
  console.log(e.oldState, '→', e.newState); // 'closed' → 'open'
});

popover.addEventListener('toggle', (e) => {
  if (e.newState === 'open') fetchContent();
});
```

## Accessibility Built-In

Native popovers get:
- `role="dialog"` behavior by default for `popover="auto"`
- `aria-expanded` on the trigger button (implicit)
- Focus management
- Escape key handling

Previously this required ARIA attributes, JavaScript focus trapping, and keyboard event handling, typically hundreds of lines of code in a "dialog" component.

## Combining with Anchor Positioning

```html
<button id="menu-btn" popovertarget="menu" anchor="menu">
  Options
</button>

<ul id="menu" popover>
  <li>Edit</li>
  <li>Delete</li>
</ul>
```

```css
#menu {
  position: absolute;
  position-anchor: attr(anchor);
  inset-area: bottom;
  margin-top: 0.25rem;
}
```

A fully functional, accessible, positioned dropdown menu. Zero JavaScript.

## When to Still Use JavaScript

The Popover API doesn't replace modal dialogs that need explicit user confirmation: use `<dialog>` with `.showModal()` for those. Popover is best for tooltips, dropdown menus, teaching overlays, and non-blocking contextual UI.

---

*Posted in* **LIVE** · *April 2026*
