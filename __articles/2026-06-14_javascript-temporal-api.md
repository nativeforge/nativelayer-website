# The Temporal API: JavaScript Date Done Right

After years of developers reaching for `date-fns`, `Luxon`, or `moment.js` to avoid the pain of JavaScript's `Date`, the TC39 Temporal proposal is finally shipping. Here's why it matters and how to use it.

## What's Wrong with `Date`

The existing `Date` object has accumulated decades of design mistakes:

- Months are zero-indexed (January = 0), days are one-indexed
- `Date` is mutable: passing a date to a function risks silent modification
- No timezone-aware arithmetic
- No way to represent a date without a time, or a time without a date
- Parsing of date strings is implementation-defined and unreliable

```js
// Classic Date footgun
const date = new Date('2026-01-01');
date.setMonth(date.getMonth() + 1); // mutates the original!
console.log(date); // Feb 01: you modified the date you passed in
```

## Temporal's Core Types

Temporal introduces distinct types for distinct concepts:

```js
// A calendar date with no time component
const birthday = Temporal.PlainDate.from('1990-06-15');

// A wall-clock time with no date
const alarm = Temporal.PlainTime.from('07:30:00');

// Date + time, but no timezone
const meeting = Temporal.PlainDateTime.from('2026-06-20T14:00:00');

// A specific instant in time (like the old Date)
const now = Temporal.Now.instant();

// Date + time + timezone: the most common need
const event = Temporal.ZonedDateTime.from('2026-06-20T14:00:00[Europe/Paris]');
```

## Immutable by Design

Every operation returns a new value:

```js
const today = Temporal.Now.plainDateISO();
const nextWeek = today.add({ weeks: 1 }); // today is unchanged

console.log(today.toString());    // 2026-06-20
console.log(nextWeek.toString()); // 2026-06-27
```

## Timezone-Aware Arithmetic

The killer feature. Adding 24 hours is not the same as adding 1 day near DST transitions:

```js
const paris = Temporal.ZonedDateTime.from('2026-03-29T01:00:00[Europe/Paris]');

// DST-safe: adds exactly 1 calendar day (23h wall-clock on DST change day)
const nextDay = paris.add({ days: 1 });

// DST-unaware: adds exactly 24 clock hours
const plus24h = paris.add({ hours: 24 });

console.log(nextDay.toString());  // 2026-03-30T01:00:00+02:00[Europe/Paris]
console.log(plus24h.toString()); // 2026-03-30T02:00:00+02:00[Europe/Paris]
```

## Duration Arithmetic

```js
const start = Temporal.PlainDate.from('2026-01-15');
const end = Temporal.PlainDate.from('2026-06-20');

const duration = start.until(end);
console.log(duration.toString()); // P5M5D (5 months, 5 days)
console.log(duration.total({ unit: 'days' })); // 156
```

## Replacing Common Patterns

```js
// Before: date-fns
import { addMonths, format } from 'date-fns';
const next = format(addMonths(new Date(), 3), 'yyyy-MM-dd');

// After: Temporal
const next = Temporal.Now.plainDateISO().add({ months: 3 }).toString();
```

## Current Status

Temporal is Stage 3 TC39, with polyfills available and browser implementations in progress. It's safe to use today with `@js-temporal/polyfill`.

---

*Posted in* **LIVE** · *June 2026*
