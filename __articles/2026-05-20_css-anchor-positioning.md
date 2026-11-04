# CSS Anchor Positioning: Tooltips and Popovers Without JavaScript

CSS Anchor Positioning is one of the most anticipated CSS features of the decade. It solves the problem that has forced developers to use Popper.js, Floating UI, and custom JavaScript positioning logic for as long as CSS has existed: **how do you place one element relative to another when they're not parent and child?**

## The Core Problem

A tooltip needs to appear above a button. But the tooltip must be positioned out of the flow (to avoid clipping from `overflow: hidden` containers), and the button could be anywhere on the page. This has historically required JavaScript to:

1. Get the button's `getBoundingClientRect()`
2. Calculate the tooltip position
3. Update on scroll and resize
4. Handle viewport edge cases

All of this is now CSS.

## Basic Anchor Positioning

```css
/* 1. Name the anchor */
.button {
  anchor-name: --my-button;
}

/* 2. Position relative to it */
.tooltip {
  position: absolute;
  position-anchor: --my-button;

  /* Place tooltip above the button, centered */
  bottom: anchor(top);
  left: anchor(center);
  translate: -50% 0;
  margin-bottom: 0.5rem;
}
```

## `@position-try` for Fallbacks

The killer feature: automatic repositioning when the preferred position would overflow the viewport.

```css
@position-try --flip-below {
  bottom: auto;
  top: anchor(bottom);
  margin-bottom: 0;
  margin-top: 0.5rem;
}

.tooltip {
  position: absolute;
  position-anchor: --my-button;
  bottom: anchor(top);
  left: anchor(center);
  translate: -50% 0;
  margin-bottom: 0.5rem;

  /* Try flipping below if it overflows viewport top */
  position-try-fallbacks: --flip-below;
}
```

The browser tries each fallback in order. If the preferred position clips, it tries the next. This replaces the entire "flip" behavior in Floating UI.

## Combining with the Popover API

```html
<button popovertarget="my-tooltip" anchor="my-tooltip">
  Hover me
</button>

<div id="my-tooltip" popover>
  I'm positioned with pure CSS!
</div>
```

```css
#my-tooltip {
  position: absolute;
  position-anchor: attr(anchor);
  bottom: anchor(top);
}
```

## Inset-Area Shorthand

For simple cases, `inset-area` replaces verbose anchor() calls:

```css
.tooltip {
  position: absolute;
  position-anchor: --my-button;
  inset-area: top;   /* centers above the anchor automatically */
  margin-bottom: 0.5rem;
}
```

## Browser Support

Anchor positioning shipped in Chrome 125 and Edge 125. Firefox and Safari are implementing. For production use today, a polyfill (`@oddbird/css-anchor-positioning`) covers the gap.

This feature will make Floating UI and Popper.js largely unnecessary for most use cases within the next browser generation.

---

*Posted in* **LIVE** · *May 2026*
