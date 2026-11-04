# The MPA Comeback: Why HTML-First Beat the SPA Default

For a decade, "modern web development" meant a JavaScript framework, a client router, and an empty `<div id="root">`. The server sent a shell; the browser downloaded a bundle; only then did users see content. That model still dominates tutorials and job posts, but the center of gravity is shifting back toward **Multi-Page Applications (MPAs)**: real HTML from the server, small JavaScript where it earns its keep, and platform APIs that finally make full-page navigation feel instant.

This is not nostalgia for PHP includes. It is a structural correction. SPAs solved problems in 2012 that the platform did not. In 2026, the platform caught up, and the costs of SPA-by-default became harder to ignore.

## What Went Wrong With SPA-First

The SPA era made sense when:

- Full-page reloads felt sluggish and stateless
- CSS transitions between "pages" required reimplementing the browser
- APIs were immature; you needed a thick client to feel responsive
- Teams wanted one language (JavaScript) end-to-end

The tradeoffs accumulated:

| SPA cost | What you pay |
|---|---|
| Initial load | Large JS bundle before first meaningful paint |
| Complexity | Routing, data fetching, cache invalidation, auth guards; all client-side |
| SEO & sharing | Extra work for meta tags, OG previews, canonical URLs |
| Accessibility | Focus management, live regions, route announcements; all manual |
| Operations | Client error monitoring, version skew, deployment coupling |
| Hiring | Framework churn; knowledge does not transfer across stacks |

Many products never needed a client-side app shell. They needed **documents with interactivity**, and MPAs always did that well. We just stopped building them because SPAs were the default mental model.

## What Changed: The Platform Caught Up

Several specs landed that remove the main UX arguments for SPA navigation:

### View Transitions API

Cross-document transitions (Chrome 126+, expanding) let the browser animate between full page loads:

```css
@view-transition {
  navigation: auto;
}

::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.25s;
}
```

Two real URLs. Two real HTML documents. A transition that feels like an SPA route change, without a client router owning history.

### Speculation Rules API

Prefetch and prerender the next page before the user clicks:

```html
<script type="speculationrules">
{
  "prefetch": [{ "where": { "href_matches": "/docs/*" } }],
  "prerender": [{ "where": { "href_matches": "/blog/post/*" } }]
}
</script>
```

Sub-100ms navigations without keeping the entire app in memory. The MPA gets SPA-like speed from **hints**, not from a monolith bundle.

### Declarative Shadow DOM + Custom Elements

Server-rendered Web Components arrive styled and structured. No flash of unstyled light DOM. JavaScript **upgrades** markup instead of creating it from scratch. MPAs can ship component-based UI without a client render pass.

### Popover, `<dialog>`, `:has()`, Container Queries, Anchor Positioning

Overlays, modals, and responsive layout no longer require React state or a positioning library. Less JavaScript needed to match native behavior on every page.

### Better MPAs tooling

Static hosts (Vercel, Netlify, Cloudflare), edge middleware, partial hydration, and islands frameworks (Astro, Enhance) made **HTML output** first-class again, not a fallback when you "don't need React yet."

## The Architecture Spectrum in 2026

Think in layers, not camps:

```
Full SPA          Hybrid / Islands          MPA + sprinkles          Static MPA
─────────────────────────────────────────────────────────────────────────────►
Notion, Figma     Marketing + docs sites    Content + forms          Brochure sites
Heavy client      Astro, partial hydrate    HTMX, Turbo, wire:*      Pure HTML/CSS
```

**SPA still wins** when:

- The UI is a continuous canvas (design tools, spreadsheets, IDEs)
- Offline-first with complex local state is core to the product
- Sub-100ms interactions depend on client-side prediction across views
- WebSockets drive most of the UI without full reload semantics

**MPA wins** when:

- Content is document-shaped (blogs, docs, marketing, e-commerce catalog)
- SEO and link previews matter on every URL
- Most visitors read; a minority interacts deeply
- You want smaller JS, simpler hosting, and faster first paint
- Teams are small and framework churn is a liability

The mistake was treating the left end as the default for everything.

## Islands and Resumability: MPAs With a JS Budget

**Islands architecture** (popularized by Astro): server renders full HTML; only interactive regions load JavaScript.

```html
<!-- Static, zero JS -->
<article>
  <h1>Release notes</h1>
  <p>Shipped Tuesday.</p>
</article>

<!-- Hydrated island -->
<search-box client:visible>
  <!-- JS loads when near viewport -->
</search-box>
```

**Resumability** (Qwik's model): serialize component state into HTML so hydration is lazy and granular. Different implementation, same principle; **do not run the whole app on load**.

Both are MPA-compatible. The URL changes; the server sends HTML; JavaScript is scoped to what moved.

## HTMX, Turbo, and "HTML Over the Wire"

Not everyone wants islands. Some teams want MPAs with **surgical DOM updates**:

```html
<button hx-post="/like" hx-target="#like-count" hx-swap="outerHTML">
  Like
</button>
```

```html
<!-- Turbo Drive: intercept links, replace <body>, no full chrome reload -->
<meta name="turbo-cache-control" content="no-cache">
```

These patterns keep server-rendered HTML as the source of truth. The client is a transport layer, not an application runtime. Fits CRUD dashboards, admin tools, and internal apps where SPA complexity never paid off.

## Performance: The Numbers That Changed Minds

MPAs with lean JS routinely beat SPAs on:

- **LCP**, content in first HTML response
- **INP**, less main-thread work at startup
- **Transfer size**, no 200KB+ vendor chunk before interaction
- **Cache efficiency**, static HTML and assets cache independently; no "deploy broke cached bundles" coupling

Google's metrics and real-user monitoring made this visible to product owners, not just performance engineers. "Ship less JavaScript" stopped being pedantry and became a KPI.

## Developer Experience: The Counter-Argument (and Its Limits)

SPA advocates still raise valid points:

- **Shared client state across views**; MPAs reset JS context per navigation unless you use workers, sessionStorage, or a persistent shell (which drifts back toward SPA)
- **Optimistic UI**; harder without a client data layer, not impossible (HTMX extensions, small Alpine islands)
- **Component reuse**; Web Components and SSR partials close the gap, string templates on the server do not
- **DX familiarity**; one React tree is mentally simple until it isn't

The honest answer: **choose by product shape**, not by resume-driven development. Docs sites do not need Redux.

## A Practical Decision Framework

Ask before defaulting to SPA:

1. **Can each URL stand alone as a document?** → Lean MPA
2. **Is most traffic read-only?** → MPA + islands
3. **Does navigation need to preserve heavy client state?** → SPA or hybrid shell
4. **Is offline a hard requirement?** → SPA or PWA with serious client storage
5. **Is the team optimizing for time-to-first-byte or time-to-interaction?** → MPA for TTFB/content; SPA only if TTI on subsequent routes dominates

## What to Learn in 2026

If you grew up on Create React App and client routers, the high-leverage skills shifted:

| Old default skill | 2026 complement |
|---|---|
| Client router (React Router) | View Transitions + Speculation Rules |
| `useEffect` fetch on mount | Server render + progressive enhancement |
| Global client store | URL state, forms, `<details>`, small islands |
| CSS-in-JS everywhere | CSS modules, layers, container queries |
| "Hydrate the whole tree" | Declarative Shadow DOM, `client:visible` |

NativeLayer-style stacks, zero-dependency libraries, Custom Elements, and MPA-friendly routers like client-side enhancement on top of real URLs, sit squarely in this lane.

## The Honest Outlook

The MPA comeback is not "SPAs are dead." Figma will stay a SPA. Your docs site probably should not have been one.

What changed is the **default**: HTML-first is credible again because the platform makes full navigations fast, animated, and prefetchable, and because bundle sizes and operational cost finally show up on dashboards.

The next generation of "modern web dev" looks less like a single-page app and more like **many good pages**, with JavaScript reserved for the parts that actually need a Turing-complete client.

---

*Posted in* **META** · *July 2026*
