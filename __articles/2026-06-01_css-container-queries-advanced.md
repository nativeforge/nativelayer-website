# CSS Container Queries: Beyond Basic Width

Container queries have been in all major browsers since late 2023, but most usage barely scratches the surface. Here's a deeper look at what they actually enable.

## Not Just Width

Container queries support multiple query types:

```css
/* Size queries */
@container (min-width: 30rem) { }
@container (max-height: 20rem) { }
@container (aspect-ratio > 1) { }

/* Style queries: newer, query CSS variable values */
@container style(--theme: dark) { }
@container style(--size: large) { }
```

Style queries let parent components communicate intent to children via CSS custom properties, without JavaScript.

## Multiple Named Containers

```css
.card {
  container-type: inline-size;
  container-name: card;
}

.sidebar {
  container-type: inline-size;
  container-name: sidebar;
}

/* Query a specific named container */
@container card (min-width: 24rem) {
  .card-body { flex-direction: row; }
}

@container sidebar (max-width: 16rem) {
  .nav-item span { display: none; }
}
```

Named containers let you be explicit about which container an element queries, even when multiple containers are nested.

## Style Queries for Theming

```css
/* Parent sets intent */
.dark-section {
  --section-theme: dark;
}

/* Child responds without needing class propagation */
@container style(--section-theme: dark) {
  .card {
    background: hsl(from var(--surface-hsl) h s calc(l - 10%));
    border-color: hsl(from var(--accent-hsl) h s l / 0.3);
  }
}
```

This eliminates the classic problem of theme-variant CSS that requires adding `.dark .card` selectors everywhere.

## Container Query Units

New units relative to the container, not the viewport:

```css
.hero-title {
  font-size: clamp(1.5rem, 5cqi, 4rem);
  /* 5cqi = 5% of container inline size */
}
```

- `cqi`: 1% of container inline size
- `cqb`: 1% of container block size
- `cqw` / `cqh`: container width / height
- `cqmin` / `cqmax`: smaller/larger of cqw and cqh

These allow truly container-relative fluid typography and spacing.

## The Web Component Use Case

Container queries are most powerful inside Web Components. The component can adapt its own layout based on how much space it has, independent of the page:

```css
:host {
  container-type: inline-size;
  container-name: my-card;
}

@container my-card (min-width: 32rem) {
  .layout {
    flex-direction: row;
  }
  .image {
    width: 40%;
    flex-shrink: 0;
  }
}
```

No media queries, no JavaScript resize observers. The component works correctly at any size in any context.

## Nesting Container Queries

```css
@container card (min-width: 24rem) {
  .card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;

    @container card (min-width: 40rem) {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}
```

Nested container queries are valid and composable.

---

*Posted in* **FIELD NOTE** · *June 2026*
