# CSS `color-mix()` and Relative Color Syntax

Two related CSS features have changed how I work with color: `color-mix()` and relative color syntax (`from <color>`). Together they make color manipulation in CSS far more expressive than custom property arithmetic.

## `color-mix()`

Mix two colors in a given color space:

```css
.button {
  /* 30% red, 70% blue in oklch */
  background: color-mix(in oklch, red 30%, blue);
}

.hover-overlay {
  /* Mix a color 20% toward white: like a lighten() function */
  background: color-mix(in oklch, var(--surface-color) 80%, white);
}

.disabled {
  /* Mix toward the background: like a desaturate/fade */
  color: color-mix(in oklch, var(--text-color) 40%, var(--bg-color));
}
```

The color space matters enormously. `in oklch` produces perceptually uniform transitions (no muddy gray-browns in the middle). `in srgb` behaves like classic CSS mixing.

## Relative Color Syntax

Modify an existing color without knowing its components in advance:

```css
.card {
  --base: hsl(220 80% 55%);
  
  /* Derive a lighter version */
  background: hsl(from var(--base) h s calc(l + 20%));
  
  /* Derive a muted version */
  border-color: hsl(from var(--base) h calc(s - 30%) l);
  
  /* Shift hue by 30 degrees */
  box-shadow: 0 0 20px hsl(from var(--base) calc(h + 30) s l / 0.4);
}
```

This is the dynamic color manipulation that previously required Sass/PostCSS `lighten()`, `darken()`, `saturate()`, now native CSS, responsive to custom property changes at runtime.

## oklch: The Right Color Space

When working with `color-mix()` and relative colors, use oklch:

```css
.palette {
  --accent: oklch(65% 0.2 250);

  /* Perceptually lighter: same lightness shift feels equal everywhere */
  --accent-light: oklch(from var(--accent) calc(l + 0.15) c h);
  
  /* Same hue, zero chroma: the perfect neutral gray for this color */
  --accent-gray: oklch(from var(--accent) l 0 h);
  
  /* Complementary hue */
  --accent-complement: oklch(from var(--accent) l c calc(h + 180));
}
```

oklch components are perceptually uniform: `l` is actual perceived lightness, not the HSL "L" that produces darker yellows and lighter purples at the same value.

## Dynamic Theme Generation

```css
:root {
  --brand-hue: 220;
}

/* Entire theme derived from one variable */
.theme {
  --primary: oklch(65% 0.22 var(--brand-hue));
  --primary-hover: oklch(from var(--primary) calc(l + 0.08) c h);
  --primary-muted: oklch(from var(--primary) l calc(c * 0.4) h);
  --on-primary: oklch(from var(--primary) calc(1 - l) 0 h);
  --surface: oklch(from var(--primary) 0.12 calc(c * 0.1) h);
}
```

Change `--brand-hue` and the entire theme shifts, maintaining perceptual consistency.

## Browser Support

`color-mix()` is in all major browsers since 2023. Relative color syntax landed in Chrome 119, Safari 16.4, and Firefox 128. Both are now baseline features.

---

*Posted in* **LIVE** · *June 2026*
