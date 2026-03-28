# Scramble Text Plugin

A GSAP ScrambleTextPlugin-like implementation for reflectx.

## Installation

```javascript
import { reflectx } from './reflectx.js';
import { scramblePlugin } from './plugins/scramble.js';

// Register with default options
reflectx.use(scramblePlugin());

// Or with custom defaults
reflectx.use(scramblePlugin({ 
  duration: 1500,
  chars: 'upperCase',
  easing: 'easeOut'
}));
```

## Declarative Usage (HTML)

The plugin uses the `x-text.scramble` attribute syntax.

### Simple Text

```html
<span x-text.scramble="'Hello World'"></span>
```

### With Duration (ms)

```html
<span x-text.scramble="scramble('Hello', 2000)"></span>
```

### With Character Set

```html
<span x-text.scramble="scramble('DECODED', 1500, 'binary')"></span>
```

### With Easing

```html
<span x-text.scramble="scramble('Message', 2000, 'lowerCase', 'easeInOut')"></span>
```

### Using State Variables

```html
<span x-text.scramble="scramble(title, 1000)"></span>
<span x-text.scramble="scramble(message, 2000, 'upperAndLower')"></span>
```

## Imperative API (JavaScript)

### `scrambleTo(element, text, options)`

Programmatically scramble an element's text.

```javascript
import { scrambleTo } from './plugins/scramble.js';

const anim = scrambleTo(element, "Hello World", {
  duration: 1000,
  chars: "binary",
  easing: "easeInOut"
});

// Control methods
anim.pause();
anim.resume();
anim.stop();
anim.finish();
anim.progress(0.5); // Jump to 50%
```

### `scrambleFromTo(element, fromText, toText, options)`

Scramble from one text to another with length tweening.

```javascript
import { scrambleFromTo } from './plugins/scramble.js';

scrambleFromTo(element, "Hi", "Hello World", { duration: 2000 });
```

### `isScrambling(element)`

Check if an element is currently animating.

```javascript
import { isScrambling } from './plugins/scramble.js';

if (isScrambling(element)) {
  console.log("Animation in progress");
}
```

### `stopScramble(element, jumpToEnd)`

Stop the animation on an element.

```javascript
import { stopScramble } from './plugins/scramble.js';

stopScramble(element);        // Stop and keep current state
stopScramble(element, true);  // Stop and jump to final text
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `duration` | `number` | `1000` | Animation duration in milliseconds |
| `chars` | `string` | `'upperCase'` | Character set name or custom characters |
| `easing` | `string` | `'easeOut'` | Easing function name |
| `delimiter` | `string` | `' '` | Characters to preserve (not scramble) |
| `revealDelay` | `number` | `0` | Delay before starting reveal (ms) |
| `speed` | `number` | `30` | How often scramble characters change (ms) |
| `rightToLeft` | `boolean` | `false` | Reveal from right to left |
| `tweenLength` | `boolean` | `false` | Animate text length changes |

## Character Sets

| Name | Characters |
|------|------------|
| `upperCase` | `ABCDEFGHIJKLMNOPQRSTUVWXYZ` |
| `lowerCase` | `abcdefghijklmnopqrstuvwxyz` |
| `numbers` | `0123456789` |
| `symbols` | `!@#$%^&*()_+-=[]{}\|;:,.<>?` |
| `upperAndLower` | Upper + lower case letters |
| `all` | Letters + numbers + symbols |
| `binary` | `01` |
| `hex` | `0123456789ABCDEF` |
| `katakana` | Japanese katakana characters |
| `hiragana` | Japanese hiragana characters |

### Custom Characters

You can pass any string as the `chars` option:

```javascript
scrambleTo(element, "Secret", { chars: "█▓▒░" });
```

```html
<span x-text.scramble="scramble('Secret', 1000, '█▓▒░')"></span>
```

## Easing Functions

| Name | Description |
|------|-------------|
| `linear` | Constant speed |
| `easeIn` | Slow start |
| `easeOut` | Slow end |
| `easeInOut` | Slow start and end |
| `easeInCubic` | Cubic slow start |
| `easeOutCubic` | Cubic slow end |
| `easeInOutCubic` | Cubic slow start and end |
| `easeInQuart` | Quartic slow start |
| `easeOutQuart` | Quartic slow end |

## Examples

### Typing Effect

```html
<h1 x-text.scramble="scramble('Welcome', 2000, 'lowerCase', 'easeOut')"></h1>
```

### Matrix-Style

```html
<span x-text.scramble="scramble('WAKE UP NEO', 3000, 'katakana')"></span>
```

### Binary Decode

```html
<span x-text.scramble="scramble('ACCESS GRANTED', 1500, 'binary', 'easeInOut')"></span>
```

### Counter/Stats

```html
<span x-text.scramble="scramble(score, 500, 'numbers')"></span>
```
