# Speculation Rules API: Instant Page Navigation

The Speculation Rules API is one of the most impactful performance features to land on the web in years. It lets browsers pre-render entire pages in the background, so navigation appears instantaneous when the user clicks.

## What It Is

Traditional prefetch loads resources (JS, CSS, images) but doesn't execute them. Pre-render goes further: the browser fully renders the destination page in a hidden browsing context, including running JavaScript. When the user navigates, it's a swap, not a load.

```html
<script type="speculationrules">
{
  "prerender": [
    {
      "where": { "href_matches": "/posts/*" },
      "eagerness": "moderate"
    }
  ]
}
</script>
```

## Eagerness Levels

```json
{
  "prerender": [
    {
      "urls": ["/about"],
      "eagerness": "immediate"
    },
    {
      "where": { "href_matches": "/*" },
      "eagerness": "moderate"
    }
  ]
}
```

- `immediate`: start immediately on page load
- `eager`: start when the link enters the viewport
- `moderate`: start when the user hovers over the link
- `conservative`: start when the user presses down (before mouseup)

`moderate` is the sweet spot: pre-render begins as the user shows intent (hover), completing the render in the ~300-500ms before the click.

## Prefetch vs Pre-render

```json
{
  "prefetch": [
    {
      "where": { "href_matches": "/api/*" },
      "eagerness": "moderate"
    }
  ],
  "prerender": [
    {
      "where": { "href_matches": "/posts/*" },
      "eagerness": "moderate"
    }
  ]
}
```

Use `prefetch` for API endpoints and non-navigable resources. Use `prerender` for pages you want to appear instant.

## Impact on Core Web Vitals

Pre-rendered pages typically show LCP of under 100ms: the browser just swaps in the already-rendered page. This dramatically impacts CWV scores for navigations, which Google now includes in ranking signals.

## Caveats

**Side effects**: The pre-rendered page runs JavaScript. Any tracking/analytics calls in `DOMContentLoaded` will fire during pre-render, before the user has actually navigated. Use `document.prerendering` to defer these:

```js
if (document.prerendering) {
  document.addEventListener('prerenderingchange', initAnalytics);
} else {
  initAnalytics();
}
```

**Resources**: Pre-rendering consumes memory and CPU. `moderate` eagerness is recommended over `immediate` for most pages to avoid unnecessary resource use.

**Server-side**: Ensure your CDN caches pre-render requests normally. The browser sends a normal GET with a `Sec-Purpose: prefetch;prerender` header: some backend frameworks need adjustment.

## Browser Support

Chrome 108+. Edge (Chromium). Firefox and Safari don't yet support Speculation Rules, falling back gracefully (the `<script type="speculationrules">` tag is simply ignored).

The performance gains are substantial enough that Speculation Rules should be on every performance-conscious site's roadmap.

---

*Posted in* **LIVE** · *June 2026*
