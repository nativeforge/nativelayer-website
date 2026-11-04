# View Transitions API: Native Page Animations Without JavaScript

For years, creating smooth page transitions in web applications required complex JavaScript frameworks, custom routing layers, and careful management of enter/exit animations. The View Transitions API changes this at the platform level.

## The Core Idea

The API captures a screenshot of the current state, performs a DOM change, captures a screenshot of the new state, then animates between the two, automatically, using CSS.

```js
// Single-page transition
document.startViewTransition(() => {
  // Any DOM mutation here
  updateContent();
});
```

That's it. By default you get a cross-fade. But the power is in what you can customize.

## Cross-Document Transitions (MPA)

The truly exciting development is **Level 2**: transitions between separate HTML documents, with no JavaScript required:

```css
/* Add to both pages */
@view-transition {
  navigation: auto;
}
```

Every navigation between pages that share this declaration will automatically cross-fade. Browser handles it. No framework. No router.

## Matching Elements Across Pages

Name elements that should animate as a unit:

```css
/* On both the list page and the detail page */
.hero-image {
  view-transition-name: hero-image;
}
```

The browser will animate the `hero-image` element from its position/size on page A to its position/size on page B. This is the "shared element transition" pattern that used to require React Native or native mobile code.

## Customizing Animations

The transition creates pseudo-elements you can target:

```css
::view-transition-old(hero-image) {
  animation: none; /* suppress default fade */
}

::view-transition-new(hero-image) {
  animation: 400ms ease-out slide-in-from-right;
}

@keyframes slide-in-from-right {
  from { transform: translateX(3rem); opacity: 0; }
}
```

## Naming Strategies

For dynamic lists, generate names from content IDs:

```js
// Before navigating
document.querySelector(`[data-id="${postId}"] .card-image`)
  .style.viewTransitionName = 'active-card';
```

```html
<!-- On the detail page -->
<img class="post-hero" style="view-transition-name: active-card">
```

## Respecting Motion Preferences

Always wrap in a motion preference check:

```css
@media (prefers-reduced-motion) {
  ::view-transition-group(*),
  ::view-transition-image-pair(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

## Browser Support

Level 1 (SPA) is in Chrome, Edge, and Safari 18+. Level 2 (MPA, cross-document) is in Chrome 126+ and landing in other browsers. Firefox support is in progress.

The cross-document mode is the biggest thing to happen to MPA performance UX since Service Workers.

---

*Posted in* **LIVE** · *June 2026*
