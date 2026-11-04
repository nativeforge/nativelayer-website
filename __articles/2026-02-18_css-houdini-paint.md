# CSS Houdini Paint API: Drawing With CSS

The CSS Houdini Paint API (CSS Custom Paint) lets you write JavaScript that acts as a CSS image: drawable in `background`, `border-image`, `mask`, anywhere a `<image>` type is accepted. This was the missing bridge between CSS and Canvas.

## Registering a Paint Worklet

```js
// checkerboard.js (worklet)
class CheckerboardPainter {
  static get inputProperties() {
    return ['--checker-size', '--checker-color-1', '--checker-color-2'];
  }

  paint(ctx, geom, properties) {
    const size = parseInt(properties.get('--checker-size')) || 20;
    const color1 = properties.get('--checker-color-1').toString().trim() || 'white';
    const color2 = properties.get('--checker-color-2').toString().trim() || 'black';

    for (let y = 0; y < geom.height / size; y++) {
      for (let x = 0; x < geom.width / size; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? color1 : color2;
        ctx.fillRect(x * size, y * size, size, size);
      }
    }
  }
}

registerPaint('checkerboard', CheckerboardPainter);
```

```js
// Main thread
await CSS.paintWorklet.addModule('checkerboard.js');
```

```css
.pattern {
  --checker-size: 24;
  --checker-color-1: hsl(175 100% 50% / 0.1);
  --checker-color-2: transparent;
  background: paint(checkerboard);
  background-size: cover;
}
```

## The `inputProperties` Bridge

The worklet declares which CSS custom properties it reads. Changing those properties in CSS re-invokes the painter, which means you can animate Houdini paint with CSS animations and transitions:

```css
.glow-border {
  --glow-progress: 0;
  background: paint(glow-sweep);
  transition: --glow-progress 0.4s ease;
}

.glow-border:hover {
  --glow-progress: 1;
}
```

The `--glow-progress` value is passed to the worklet, which draws a glow sweep proportional to the progress. The animation runs in the compositor thread.

## Practical Use Cases

**Noise/grain texture**:
```js
paint(ctx, geom) {
  for (let x = 0; x < geom.width; x += 2) {
    for (let y = 0; y < geom.height; y += 2) {
      const alpha = Math.random() * 0.05;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
}
```

**Animated border gradient**: CSS can't do animated border images efficiently. A Houdini painter can draw a rotating gradient border that responds to a CSS custom property, driven by a CSS `@keyframes` animation.

**Polkadot / circuit board backgrounds**: Pattern generators that respond to container size.

## Browser Support

The Paint API is supported in Chrome and Edge. Firefox has it behind a flag. Safari is implementing. For production use, you can feature-detect and provide a CSS fallback:

```css
@supports (background: paint(checkerboard)) {
  .pattern { background: paint(checkerboard); }
}
```

## Why It Matters

Before Houdini, if CSS couldn't natively express a visual effect, you had two options: use SVG background images (hard to theme), or manipulate the DOM with JavaScript (breaks with CSS transitions). Houdini closes this gap by making the CSS rendering engine extensible.

---

*Posted in* **FIELD NOTE** · *February 2026*
