:: { style="width: 96px; height: auto;" }
![routerx logo](/__src/img/routerx-logo.svg)
::

# routerx

RouterX is a feature-rich yet lightweight vanilla JavaScript router with support for both history and hash-based routing modes. It provides comprehensive routing capabilities including dynamic path parameters, query parsing, hash fragment support, route guards, lazy loading, event hooks, and navigation management—all without hijacking link clicks or requiring complex framework setup. Works great for traditional multi-page websites (MPA), simple SPAs, or static hosting environments.

## Key Features

- ✅ **Lightweight & Zero Dependencies** - ~3.4KB gzipped, no external dependencies
- ✅ **Lightweight & Versatile** - Works for both traditional MPAs and simple SPAs 
- ✅ **Dynamic Path Parameters** - Support for `:id` style parameters with automatic parsing
- ✅ **Query String Parsing** - Automatic URLSearchParams parsing into objects
- ✅ **Hash Fragment Support** - Full hash/anchor support with automatic parsing and navigation
- ✅ **History Management** - Full browser history API integration with back/forward support
- ✅ **Route Guards** - Built-in authentication/authorization with async support
- ✅ **Lazy Loading** - Code splitting support with dynamic imports
- ✅ **Event Hooks** - Before/after middleware system for cross-cutting concerns
- ✅ **Redirects** - Automatic route redirections
- ✅ **Route Management** - Add/remove routes dynamically at runtime
- ✅ **URL Building** - Programmatic URL generation from patterns
- ✅ **404 Handling** - Customizable fallback for unmatched routes
- ✅ **Server-Side Friendly** - Works with static hosting and server-side routing
- ✅ **Dual Routing Modes** - Support for both history API and hash-based routing
- ✅ **Built-in Sanitization** - URL and parameter sanitization to prevent XSS and path traversal
- ✅ **Route Lifecycle Hooks** - beforeEnter/afterEnter/beforeLeave/afterLeave for route-specific logic
- ✅ **Route Metadata** - Attach custom data (title, auth, layout) to routes
- ✅ **Scroll Behavior Control** - Configure scroll position on navigation with back/forward support
- ✅ **Cleanup Functions** - Handlers can return cleanup functions (React useEffect pattern)

## Installation

### Package Sizes

All builds are optimized for production use:

| File | Size | Gzipped | Format | Description |
|------|------|---------|--------|-------------|
| `dist/routerx.esm.min.js` | **11.6 KB** | **3.4 KB** | ES Module | Minified (recommended for modern browsers) |
| `dist/routerx.cjs.min.js` | **11.6 KB** | **3.4 KB** | CommonJS | Minified (for Node.js/bundlers) |
| `dist/routerx.min.js` | **11.8 KB** | **3.5 KB** | UMD | Minified (for legacy browsers) |
| `dist/routerx.esm.js` | 37.8 KB | 8.7 KB | ES Module | Development version |
| `dist/routerx.cjs.js` | 37.9 KB | 8.7 KB | CommonJS | Development version |
| `dist/routerx.js` | 40.5 KB | 8.9 KB | UMD | Development version |

**Recommended:** Use `routerx.esm.min.js` for production (11.6 KB / 3.4 KB gzipped) — zero dependencies, maximum performance.

### Using ES Modules (Recommended)

Copy `src/routerx.js` into your project and import it:

```html
<script type="module">
import { RouterX } from './src/routerx.js';

// History mode (default) - requires server configuration for clean URLs
const router = new RouterX();

// Or hash mode - works with any static hosting
// const router = new RouterX({ mode: 'hash' });

// Your routing code here
router.start();
</script>
```

### Using Built Files

For production, use the pre-built files:

```html
<!-- For modern browsers (ES Modules) -->
<script type="module">
import { RouterX } from './dist/routerx.esm.js';
const router = new RouterX();
</script>

<!-- For older browsers (UMD) -->
<script src="./dist/routerx.js"></script>
<script>
const router = new window.routerx.RouterX();
</script>
```

### Via npm

```bash
npm install routerx
```

```js
// ES Module import
import { RouterX } from 'routerx';

// CommonJS require
const { RouterX } = require('routerx');
```

## API Reference

### Core Methods

| Method / Property             | Description                                                                                         |
| ---                           | ---                                                                                                 |
| `constructor(options?)`       | Creates a new router instance. Options: `{ mode: 'history' \| 'hash', scrollBehavior: Function \| Object }`. Defaults to history mode.   |
| `start()`                     | Parses the current URL and dispatches the matching route handler immediately on page load.          |
| `on(pattern, handler, options?)` | Register a route with optional lifecycle hooks and metadata. Options: `{ beforeEnter, afterEnter, beforeLeave, afterLeave, meta }`. |
| `notFound(handler: (path, query, hash) => void)` | Register a fallback handler for unmatched routes (404).                                    |
| `normalizeEndSlash(path: string)` | Normalize trailing slash on a path (removes trailing slash by default, except for root).        |

### Navigation Methods

| Method                        | Description                                                                                         |
| ---                           | ---                                                                                                 |
| `navigate(path: string)`      | Navigate to `path`. In history mode uses `pushState`; in hash mode sets `window.location.hash`.    |
| `navigateWithHash(path: string, hash?: string)` | Navigate to a path with optional hash fragment. In hash mode: `#/path#fragment`.   |
| `replace(path: string)`       | Replace current history entry. In history mode uses `replaceState`; in hash mode updates hash.     |
| `back()`                      | Navigate back in browser history using `history.back()`.                                           |
| `forward()`                   | Navigate forward in browser history using `history.forward()`.                                     |
| `canGoBack(): boolean`        | Check if browser can go back in history (returns `true` if `history.length > 1`).                 |
| `canGoForward(): boolean`     | Check if browser can go forward in history (simplified implementation).                            |

### Route Management

| Method                        | Description                                                                                         |
| ---                           | ---                                                                                                 |
| `off(pattern: string): boolean` | Remove a registered route by pattern. Returns `true` if route was found and removed.             |
| `has(pattern: string): boolean` | Check if a route pattern is currently registered. Returns `true` if route exists.                |
| `clear()`                     | Remove all registered routes and clear the notFound handler.                                       |

### Route Information & Utilities

| Method                        | Description                                                                                         |
| ---                           | ---                                                                                                 |
| `getCurrentRoute(): Object\|null` | Get current route information as a defensive copy `{ path, params, query, hash, pattern, meta }`.             |
| `buildUrl(pattern, params, query, hash): string` | Generate URL from pattern, parameters, query, and hash. Prefixes with `#` in hash mode.|
| `isCurrentRoute(pattern: string): boolean` | Check if the current route matches the given pattern.                                    |

### Event Hooks & Middleware

| Method                        | Description                                                                                         |
| ---                           | ---                                                                                                 |
| `before(callback: Function)`  | Add a hook that runs before route changes. Callback receives `(path, query, hash, previousRoute)`. Can cancel by returning `false`. |
| `beforeEach(callback: Function)` | Alias for `before()`. Vue Router-style naming for familiarity.                                  |
| `after(callback: Function)`   | Add a hook that runs after route changes. Callback receives `(currentRoute, previousRoute)`.      |
| `afterEach(callback: Function)` | Alias for `after()`. Vue Router-style naming for familiarity.                                    |

### Route Lifecycle Hooks

| Hook | When Called | Can Cancel? | Use Case |
|------|-------------|-------------|----------|
| `beforeEnter` | Before entering a route | Yes (return `false`) | Auth checks, data prefetching |
| `afterEnter` | After route handler runs | No | Analytics, scroll position |
| `beforeLeave` | Before leaving a route | Yes (return `false`) | Unsaved changes prompt |
| `afterLeave` | After leaving a route | No | Cleanup timers, subscriptions |

### Advanced Features

| Method                        | Description                                                                                         |
| ---                           | ---                                                                                                 |
| `redirect(from, to, options?)` | Set up automatic redirect with optional lifecycle hooks.                                           |
| `lazy(pattern, loader, options?)` | Register a lazy-loaded route with optional lifecycle hooks.                                     |
| `guard(pattern, guardFn, onBlock?): boolean` | Add authentication/authorization guard to a route.                                |
| `addRouteHooks(pattern, hooks): boolean` | Add lifecycle hooks to an existing route (useful for plugins).                        |

### Security & Sanitization

| Method                        | Description                                                                                         |
| ---                           | ---                                                                                                 |
| `sanitize(value: string): string` | Sanitize a value for safe display. Encodes HTML entities and removes control characters.        |
| `sanitizePath(path: string, options?): string` | Sanitize a URL path against traversal attacks and dangerous protocols.               |
| `isUrlSafe(url: string, allowedProtocols?): boolean` | Check if a URL is safe (no dangerous protocols like `javascript:`).            |

### Properties

| Property                      | Description                                                                                         |
| ---                           | ---                                                                                                 |
| `current`                     | An object `{ path, params, query, hash, pattern, meta }` representing the last-dispatched route.                  |
| `previous`                    | An object `{ path, params, query, hash, pattern, meta }` representing the route before the current one (or `null`). |


## Routing Modes

RouterX supports two routing modes to accommodate different hosting and deployment scenarios:

### History Mode (Default)

Uses the browser's History API (`pushState`/`replaceState`) with clean URLs:

```js
const router = new RouterX(); // or { mode: 'history' }

// URLs look like: /page/1, /user/123, /blog/post-title
router.on('/page/:num', (params) => console.log('Page:', params.num));
router.start();
```

**Pros:**

- Clean, SEO-friendly URLs (`/user/123`)
- Better user experience with traditional-looking paths

**Cons:**

- Requires server configuration to handle client-side routes (rewrites to `index.html`)
- Won't work with simple static file hosting without configuration

### Hash Mode

Uses the URL hash (`#`) for routing, which doesn't require server configuration:

```js
const router = new RouterX({ mode: 'hash' });

// URLs look like: #/page/1, #/user/123, #/blog/post-title
router.on('/page/:num', (params) => console.log('Page:', params.num));
router.start();
```

**Pros:**

- Works with any static file server (no configuration needed)
- Hash changes don't trigger server requests
- Great for GitHub Pages, S3, or simple hosting

**Cons:**

- URLs include `#` prefix (`example.com/#/user/123`)
- Hash portion is not sent to server (SEO considerations)

### Hash Mode Features

Hash mode fully supports all RouterX features:

```js
const router = new RouterX({ mode: 'hash' });

// Dynamic parameters work the same
router.on('/user/:id', (params, query, hash) => {
  console.log('User:', params.id);
});

// Query strings are parsed from the hash: #/search?q=test
router.on('/search', (params, query) => {
  console.log('Search query:', query.q);
});

// Hash fragments within hash mode: #/docs#section1
router.on('/docs', (params, query, hash) => {
  console.log('Section:', hash); // 'section1'
});

// Navigation
router.navigate('/user/123');           // Sets hash to #/user/123
router.navigateWithHash('/docs', 'api'); // Sets hash to #/docs#api

// URL building returns hash-prefixed URLs
const url = router.buildUrl('/user/:id', { id: '123' });
console.log(url); // '#/user/123'

router.start();
```

### Choosing a Mode

| Scenario | Recommended Mode |
|----------|------------------|
| Server with rewrite rules (Express, Nginx, Vercel) | `history` |
| Static hosting without configuration | `hash` |
| GitHub Pages, S3, simple CDN | `hash` |
| SEO-critical application | `history` |
| Embedded widgets or iframes | `hash` |
| Legacy browser support needed | `hash` |

## Examples

### Basic Usage

```js
import { RouterX } from './src/routerx.js';

// History mode (default) - clean URLs like /user/123
const router = new RouterX();

// Or use hash mode - URLs like #/user/123
// const router = new RouterX({ mode: 'hash' });

// Register routes
router.on('/', (params, query, hash) => {
  console.log('Home page loaded');
  if (hash) console.log('Hash fragment:', hash);
});

router.on('/user/:id', (params, query, hash) => {
  console.log('User ID:', params.id);
  console.log('Query params:', query);
  console.log('Hash fragment:', hash);
});

// Handle 404s
router.notFound((path, query, hash) => {
  console.log('Page not found:', path);
  if (hash) console.log('Hash was:', hash);
});

// Initialize router
router.start();
```

### Navigation Methods
```js
// Navigate to a new page (adds to history)
router.navigate('/user/123');

// Navigate with hash fragment
router.navigateWithHash('/docs', 'getting-started');
router.navigateWithHash('/user/123', 'profile');

// Replace current page (doesn't add to history)
router.replace('/user/456');

// Navigate back and forward
router.back();
router.forward();

// Check navigation availability
if (router.canGoBack()) {
  router.back();
}
```

### Route Management
```js
// Check if route exists
if (router.has('/admin')) {
  console.log('Admin route is registered');
}

// Remove a route
const removed = router.off('/temp-route');
console.log('Route removed:', removed);

// Clear all routes
router.clear();
```

### Route Information & URL Building
```js
// Get current route info
const current = router.getCurrentRoute();
console.log('Current:', current);
// => { path: '/user/123', params: { id: '123' }, query: { tab: 'profile' }, hash: 'bio', pattern: '/user/:id', meta: { requiresAuth: true } }

// Check if current route matches pattern
if (router.isCurrentRoute('/user/:id')) {
  console.log('Currently viewing a user page');
}

// Build URLs programmatically
const userUrl = router.buildUrl('/user/:id', { id: '123' });
console.log(userUrl); // => '/user/123'

const searchUrl = router.buildUrl('/search', {}, { q: 'routerx', page: '2' });
console.log(searchUrl); // => '/search?q=routerx&page=2'

// With hash fragments
const docsUrl = router.buildUrl('/docs', {}, {}, 'installation');
console.log(docsUrl); // => '/docs#installation'

const complexUrl = router.buildUrl('/user/:id/posts/:postId', 
  { id: '123', postId: '456' }, 
  { sort: 'date', order: 'desc' },
  'comments'
);
console.log(complexUrl); // => '/user/123/posts/456?sort=date&order=desc#comments'
```

### Event Hooks & Middleware
```js
// Add before hooks (runs before route change)
router.before((path, query, hash, previousRoute) => {
  console.log('Navigating to:', path);
  console.log('Hash fragment:', hash);
  console.log('Coming from:', previousRoute?.path);
  
  // Analytics, loading states, etc.
  gtag('event', 'page_view', { 
    page_path: path,
    page_hash: hash 
  });
});

// Add after hooks (runs after route change)
router.after((currentRoute, previousRoute) => {
  console.log('Route changed to:', currentRoute.path);
  console.log('Pattern matched:', currentRoute.pattern);
  console.log('Route metadata:', currentRoute.meta);
  
  // Update page title from route metadata (if defined)
  document.title = currentRoute.meta?.title || `App - ${currentRoute.path}`;
  
  // Note: Hash scrolling can be handled automatically via scrollBehavior option
  // See "Scroll Behavior" section for details
});

// Multiple hooks are supported
router.before(() => console.log('Hook 1'));
router.before(() => console.log('Hook 2'));
```

### Hash Fragment Support

```js
// Handle routes with hash fragments
router.on('/docs', (params, query, hash) => {
  console.log('Documentation page loaded');
  console.log('Section:', hash); // e.g., "installation", "api-reference"
  
  // Scroll to the specific section
  if (hash) {
    const element = document.getElementById(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
});

// Navigate with hash
router.navigateWithHash('/docs', 'getting-started');
router.navigateWithHash('/user/123', 'profile');

// Build URLs with hash
const docsUrl = router.buildUrl('/docs', {}, {}, 'api');
console.log(docsUrl); // => '/docs#api'

// Access current hash
console.log('Current hash:', router.current?.hash);

// Hash changes are tracked in route history
router.navigateWithHash('/guide', 'section1');
console.log('Current:', router.current.hash); // => 'section1'

router.navigateWithHash('/guide', 'section2');
console.log('Current:', router.current.hash);  // => 'section2'
console.log('Previous:', router.previous.hash); // => 'section1'

// Combine with dynamic routes and query params
router.on('/article/:id', (params, query, hash) => {
  console.log('Article ID:', params.id);
  console.log('Search term:', query.search);
  console.log('Highlighted section:', hash);
});

// Navigate to: /article/123?search=javascript#conclusion
router.navigate('/article/123?search=javascript#conclusion');
```

### Redirects

```js
// Simple redirect
router.redirect('/old-path', '/new-path');

// Redirect with parameters
router.redirect('/legacy-user/:id', '/profile');

// When someone visits /legacy-user/123, they'll be redirected to /profile
```

### Lazy Loading

```js
// Lazy load route handlers for code splitting
router.lazy('/dashboard', async () => {
  const module = await import('./dashboard-handler.js');
  return module.default; // or just return the function directly
});

// With dynamic imports
router.lazy('/admin/:section', async () => {
  const { adminHandler } = await import('./admin/index.js');
  return adminHandler;
});

// Error handling is built-in
router.lazy('/heavy-page', async () => {
  try {
    return await import('./heavy-component.js');
  } catch (error) {
    console.error('Failed to load component:', error);
    // Fallback handler
    return () => console.log('Fallback handler');
  }
});
```

### Route Lifecycle Hooks

Route lifecycle hooks allow you to run code at specific points during route transitions. All hooks support async/await.

```js
// Register a route with lifecycle hooks
router.on('/editor/:docId', editorHandler, {
  // Called before entering the route (can cancel navigation)
  beforeEnter: async (params, query, hash) => {
    console.log('Loading document:', params.docId);
    await prefetchDocument(params.docId);
    return true; // Return false to cancel navigation
  },
  
  // Called after the route handler runs
  afterEnter: (params, query, hash) => {
    analytics.trackPageView('/editor/' + params.docId);
    document.title = 'Editing: ' + params.docId;
  },
  
  // Called before leaving the route (can cancel navigation)
  beforeLeave: (params, query, hash) => {
    if (hasUnsavedChanges()) {
      return confirm('You have unsaved changes. Leave anyway?');
    }
    return true; // Return false to cancel navigation
  },
  
  // Called after leaving the route (cleanup)
  afterLeave: (params, query, hash) => {
    cleanupEditorResources();
    clearAutoSaveTimer();
  }
});
```

#### Execution Order

When navigating from Route A to Route B:

1. Global `before` / `beforeEach` hooks (can cancel)
2. Plugin `beforeRoute` hooks (can cancel)
3. Route A's `beforeLeave` (can cancel)
4. Plugin `onBeforeLeave` hooks (can cancel)
5. Route A's cleanup function (if handler returned one)
6. Route A's `afterLeave`
7. Plugin `onAfterLeave` hooks
8. Route B's `beforeEnter` (can cancel)
9. Plugin `onBeforeEnter` hooks (can cancel)
10. Route B's handler (may return cleanup function)
11. Route B's `afterEnter`
12. Plugin `onAfterEnter` hooks
13. Global `after` / `afterEach` hooks
14. Plugin `afterRoute` hooks
15. Scroll behavior applied

#### Common Use Cases

**Unsaved changes prompt:**

```js
router.on('/form', formHandler, {
  beforeLeave: () => {
    if (formIsDirty) {
      return confirm('Discard unsaved changes?');
    }
    return true;
  }
});
```

**Data prefetching:**

```js
router.on('/user/:id', showUserProfile, {
  beforeEnter: async (params) => {
    // Prefetch data before showing the route
    window.userData = await fetchUser(params.id);
    return true;
  }
});
```

**Resource cleanup:**

```js
router.on('/live-stream', streamHandler, {
  afterLeave: () => {
    // Clean up when leaving the route
    websocket.close();
    clearInterval(heartbeatTimer);
    videoPlayer.destroy();
  }
});
```

**Analytics tracking:**

```js
router.on('/product/:id', productHandler, {
  afterEnter: (params) => {
    analytics.track('product_view', { productId: params.id });
  },
  beforeLeave: (params) => {
    analytics.track('product_leave', { 
      productId: params.id,
      timeOnPage: Date.now() - pageLoadTime
    });
    return true;
  }
});
```

#### Adding Hooks to Existing Routes

Use `addRouteHooks()` to add lifecycle hooks to routes that are already registered (useful for plugins):

```js
// Route already registered
router.on('/dashboard', dashboardHandler);

// Add hooks later (e.g., from a plugin)
router.addRouteHooks('/dashboard', {
  beforeEnter: async () => {
    await checkPermissions();
    return true;
  },
  afterLeave: () => {
    clearDashboardCache();
  }
});
```

#### Plugin Lifecycle Hooks

Plugins can register global lifecycle hooks that run for all routes:

```js
const lifecyclePlugin = {
  name: 'lifecycle-logger',
  
  // Called before leaving any route
  onBeforeLeave: (previousRoute, router) => {
    console.log('Leaving:', previousRoute.path);
    return true; // Return false to cancel
  },
  
  // Called after leaving any route
  onAfterLeave: (previousRoute, router) => {
    console.log('Left:', previousRoute.path);
  },
  
  // Called before entering any route
  onBeforeEnter: (newRoute, router) => {
    console.log('Entering:', newRoute.path);
    return true; // Return false to cancel
  },
  
  // Called after entering any route
  onAfterEnter: (currentRoute, router) => {
    console.log('Entered:', currentRoute.path);
  }
};

router.use(lifecyclePlugin);
```

### Route Metadata

Attach custom metadata to routes for page titles, authentication requirements, layouts, and more:

```js
router.on('/admin/users', usersHandler, {
  meta: {
    title: 'User Management',
    requiresAuth: true,
    requiredRole: 'admin',
    layout: 'admin-panel'
  }
});

router.on('/public/about', aboutHandler, {
  meta: {
    title: 'About Us',
    requiresAuth: false
  }
});

// Access metadata via current route
router.after((current) => {
  // Update page title
  if (current.meta.title) {
    document.title = `${current.meta.title} - My App`;
  }
  
  // Apply layout
  if (current.meta.layout) {
    document.body.className = current.meta.layout;
  }
});

// Use in guards
router.before((path, query, hash, previous) => {
  const route = router.current;
  if (route?.meta?.requiresAuth && !isAuthenticated()) {
    router.navigate('/login');
    return false;
  }
  return true;
});
```

### Cleanup Functions

Route handlers can return a cleanup function that's automatically called when leaving the route (similar to React's useEffect pattern):

```js
router.on('/live-dashboard', (params) => {
  // Set up resources
  const ws = new WebSocket('wss://api.example.com/live');
  const interval = setInterval(updateStats, 5000);
  const observer = new MutationObserver(handleMutations);
  observer.observe(document.body, { childList: true });
  
  // Return cleanup function - called automatically when leaving
  return () => {
    ws.close();
    clearInterval(interval);
    observer.disconnect();
    console.log('Dashboard resources cleaned up');
  };
});

// Works with async handlers too
router.on('/data/:id', async (params) => {
  const controller = new AbortController();
  const data = await fetch(`/api/data/${params.id}`, { 
    signal: controller.signal 
  });
  
  renderData(data);
  
  // Cleanup: abort any pending requests
  return () => controller.abort();
});
```

Cleanup functions run after `beforeLeave` hooks but before `afterLeave` hooks.

### Scroll Behavior

Control scroll position on navigation with the `scrollBehavior` option:

```js
// Simple: scroll to top on every navigation
const router = new RouterX({
  scrollBehavior: { top: 0 }
});

// With smooth scrolling
const router = new RouterX({
  scrollBehavior: { top: 0, behavior: 'smooth' }
});

// Advanced: custom function with saved position support
const router = new RouterX({
  scrollBehavior: (to, from, savedPosition) => {
    // Back/forward navigation: restore saved position
    if (savedPosition) {
      return savedPosition;
    }
    
    // Hash navigation: scroll to anchor
    if (to.hash) {
      return { el: `#${to.hash}`, behavior: 'smooth' };
    }
    
    // Default: scroll to top
    return { top: 0 };
  }
});
```

**Scroll position options:**

| Option | Description |
|--------|-------------|
| `{ top: 0 }` | Scroll to top |
| `{ left: 0, top: 0 }` | Scroll to specific coordinates |
| `{ x: 0, y: 0 }` | Alternative coordinate syntax |
| `{ el: '#section' }` | Scroll to element by selector |
| `{ behavior: 'smooth' }` | Enable smooth scrolling |
| `savedPosition` | Automatically saved scroll position for back/forward |

### Route Guards (Authentication/Authorization)

```js
// Simple authentication guard with hash support
router.on('/profile', (params, query, hash) => {
  console.log('Profile page loaded');
  if (hash === 'settings') {
    showSettingsPanel();
  }
});

router.guard('/profile', async (params, query, hash) => {
  // Check if user is authenticated
  const token = localStorage.getItem('auth_token');
  return token && await validateToken(token);
}, (params, query, hash) => {
  // Optional: custom block handler with previous route tracking
  const returnUrl = router.buildUrl('/profile', params, query, router.current?.hash);
  router.navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
});

// Role-based authorization with previous route context
router.on('/admin/:section', (params, query, hash) => {
  console.log('Admin section:', params.section);
  
  // Check where user came from for audit logging
  if (router.previous) {
    console.log('User accessed admin from:', router.previous.path);
    logAdminAccess({
      section: params.section,
      previousRoute: router.previous.path,
      hash: hash,
      timestamp: new Date().toISOString()
    });
  }
});

router.guard('/admin/:section', async (params, query) => {
  const user = await getCurrentUser();
  return user && user.role === 'admin';
}, (params, query) => {
  // Save attempted admin access with previous route context
  const attemptedAccess = {
    path: `/admin/${params.section}`,
    hash: router.current?.hash,
    referrer: router.previous?.path || 'direct',
    timestamp: new Date().toISOString()
  };
  
  logUnauthorizedAttempt(attemptedAccess);
  alert('Access denied: Admin privileges required');
  
  // Return to previous page if it exists, otherwise go home
  if (router.previous && !router.previous.path.startsWith('/admin/')) {
    router.navigate(router.previous.path);
  } else {
    router.navigate('/');
  }
});

// Context-aware navigation guard
router.guard('/checkout', async (params, query) => {
  const user = await getCurrentUser();
  const hasValidSession = user && user.session?.valid;
  
  if (!hasValidSession) {
    // Store the intended checkout destination with hash
    const intendedDestination = router.buildUrl('/checkout', params, query, router.current?.hash);
    sessionStorage.setItem('checkout_return_url', intendedDestination);
    
    // Include source page context for analytics
    const sourceContext = {
      from: router.previous?.path || 'direct',
      fromHash: router.previous?.hash,
      checkoutParams: params,
      timestamp: Date.now()
    };
    
    trackCheckoutAbandon(sourceContext);
    return false;
  }
  
  return true;
}, (params, query) => {
  // Custom block handler that preserves user's shopping context
  const returnUrl = router.buildUrl('/checkout', params, query, router.current?.hash);
  const sourceInfo = router.previous ? `from ${router.previous.path}` : 'directly';
  
  showLoginModal({
    title: 'Login Required for Checkout',
    message: `Please log in to continue with your purchase (accessed ${sourceInfo})`,
    returnUrl: returnUrl,
    context: 'checkout'
  });
});

// Multi-step process guard with hash-based state tracking
router.on('/survey/:step', (params, query, hash) => {
  console.log(`Survey step ${params.step} loaded`);
  
  // Use hash to track sub-sections within steps
  if (hash) {
    scrollToSection(hash);
    trackSurveySubsection(params.step, hash);
  }
});

router.guard('/survey/:step', async (params, query) => {
  const step = parseInt(params.step);
  const user = await getCurrentUser();
  
  if (!user) return false;
  
  // Check if user can access this step based on previous progress
  const progress = await getUserSurveyProgress(user.id);
  const canAccess = step <= progress.maxStep + 1;
  
  if (!canAccess) {
    // Track attempt to skip steps
    trackSurveySkipAttempt({
      userId: user.id,
      attemptedStep: step,
      currentMaxStep: progress.maxStep,
      previousRoute: router.previous?.path,
      hash: router.current?.hash
    });
  }
  
  return canAccess;
}, (params, query) => {
  const step = parseInt(params.step);
  
  // Redirect to the appropriate step with context
  getUserSurveyProgress(getCurrentUser().id).then(progress => {
    const redirectStep = Math.max(1, progress.maxStep);
    const redirectPath = `/survey/${redirectStep}`;
    
    // Preserve hash if it was a valid subsection
    const validHashes = ['intro', 'questions', 'summary'];
    const preserveHash = router.current?.hash && validHashes.includes(router.current.hash);
    
    if (preserveHash) {
      router.navigateWithHash(redirectPath, router.current.hash);
    } else {
      router.navigate(redirectPath);
    }
    
    // Show contextual message
    showNotification({
      type: 'warning',
      message: `Please complete step ${redirectStep} before proceeding to step ${step}`,
      action: 'Continue Survey'
    });
  });
});

// Premium content guard with referrer tracking
router.guard('/premium/:contentId', async (params, query) => {
  const user = await getCurrentUser();
  const hasAccess = user?.subscription === 'premium';
  
  if (!hasAccess) {
    // Track premium content access attempts with full context
    trackPremiumContentAttempt({
      contentId: params.contentId,
      userId: user?.id || 'anonymous',
      referrer: router.previous?.path || 'direct',
      referrerHash: router.previous?.hash,
      targetHash: router.current?.hash,
      query: query,
      timestamp: new Date().toISOString()
    });
  }
  
  return hasAccess;
}, (params, query) => {
  // Enhanced upgrade flow with context
  const contentInfo = {
    id: params.contentId,
    source: router.previous?.path || 'direct',
    hash: router.current?.hash
  };
  
  // Build return URL preserving all context
  const returnUrl = router.buildUrl(
    `/premium/${params.contentId}`, 
    params, 
    query, 
    router.current?.hash
  );
  
  router.navigate(`/upgrade?content=${params.contentId}&return=${encodeURIComponent(returnUrl)}`);
  
  // Show contextual upgrade prompt
  showUpgradePrompt({
    contentType: 'premium',
    contentId: params.contentId,
    accessedFrom: router.previous?.path,
    returnUrl: returnUrl
  });
});
```

### Advanced Patterns

```js
// Combining multiple features
const router = new RouterX();

// Global navigation logger
router.before((path) => {
  console.log(`[${new Date().toISOString()}] Navigating to: ${path}`);
});

// Authentication middleware
router.before(async (path, query, previous) => {
  if (path.startsWith('/protected/')) {
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.navigate('/login');
      return false; // Prevent route handler execution
    }
  }
});

// Set up redirects
router.redirect('/home', '/');
router.redirect('/user/:id/settings', '/settings');

// Protected routes with guards
router.on('/protected/dashboard', dashboardHandler);
router.guard('/protected/dashboard', checkAuthGuard, redirectToLogin);

// Lazy-loaded admin section
router.lazy('/admin/:page', () => import('./admin/router.js'));

// Initialize
router.start();

// Helper functions
async function checkAuth() {
  // Your auth logic here
  return localStorage.getItem('token') !== null;
}

function checkAuthGuard() {
  return checkAuth();
}

function redirectToLogin() {
  router.navigate('/login');
}
```

### Access Previous Route
```js
// Navigate programmatically and track history
router.navigate('/about');
console.log('Previous route:', router.previous);
// => { path: '/', params: {}, query: {} }

// Use in route handlers
router.on('/confirmation', (params, query) => {
  const previous = router.previous;
  if (previous && previous.path === '/checkout') {
    console.log('User came from checkout');
  } else {
    // Redirect if they didn't come from checkout
    router.navigate('/');
  }
});
```

## Shared Routes Module

You can centralize your route definitions in a single module and reuse it across all pages:

```js
// src/routes.js
import { RouterX } from './routerx.js';

// Use history mode (default) or hash mode
const router = new RouterX(); // or { mode: 'hash' }

// Define your routes
router.on('/', (params, query, hash) => {
  console.log('Home loaded', params, query, hash);
});
router.on('/about', (params, query, hash) => {
  console.log('About loaded', params, query, hash);
});
router.on('/user/:id', (params, query, hash) => {
  console.log('User ID:', params.id, 'Hash:', hash);
});
router.notFound((path, query, hash) => {
  console.warn('404:', path, 'Hash:', hash);
});

// Initialize on page load
router.start();

export default router;
```

Then in each HTML page, simply import this module instead of redefining routes:

```html
<script type="module" src="./src/routes.js"></script>
```

## Server Configuration

### Why Server Setup Matters

When using **history mode** (the default), RouterX creates clean URLs like `/user/123` or `/posts/456`. However, when a user directly accesses these URLs (via bookmark, refresh, or external link), the server receives the request first—and without proper configuration, it will return a 404 because no file exists at that path.

**The solution:** Configure your server to rewrite dynamic routes to the appropriate HTML file, allowing RouterX to handle the routing client-side.

> **Using hash mode?** If you're using `{ mode: 'hash' }`, you can skip this entire section. Hash-based URLs (`#/user/123`) are handled entirely client-side and work with any static file server without configuration.

---

### Development Environment

#### Option 1: Vite (Recommended)

Vite handles history mode out of the box with its dev server:

```js
// vite.config.js
export default {
  server: {
    // Enable history API fallback for SPA-style routing
    historyApiFallback: true
  }
}
```

For MPA with multiple entry points:

```js
// vite.config.js
export default {
  appType: 'mpa',
  server: {
    middlewareMode: false
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        user: 'user/index.html',
        posts: 'posts/index.html'
      }
    }
  }
}
```

#### Option 2: Express Development Server

Create a simple development server with hot-reload friendly configuration:

```js
// server.dev.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files first
app.use(express.static(__dirname));

// Dynamic route rewrites - add your routes here
const dynamicRoutes = [
  { pattern: '/user/:id', file: 'user/index.html' },
  { pattern: '/posts/:postId', file: 'posts/index.html' },
  { pattern: '/posts/:postId/comments/:commentId', file: 'posts/index.html' }
];

dynamicRoutes.forEach(({ pattern, file }) => {
  app.get(pattern, (req, res) => {
    res.sendFile(path.join(__dirname, file));
  });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, () => {
  console.log(`Development server: http://localhost:${PORT}`);
});
```

Run with: `node server.dev.js`

#### Option 3: Live Server with Fallback

If using VS Code's Live Server extension, add to `.vscode/settings.json`:

```json
{
  "liveServer.settings.file": "index.html"
}
```

This serves `index.html` for all routes, suitable for SPAs.

---

### Production Environment

#### Static Hosting Platforms

Most static hosting platforms support rewrite rules for history mode routing.

##### Vercel

Create `vercel.json` in your project root:

```json
{
  "rewrites": [
    { "source": "/user/:id", "destination": "/user/index.html" },
    { "source": "/posts/:postId", "destination": "/posts/index.html" },
    { "source": "/posts/:postId/comments/:commentId", "destination": "/posts/index.html" }
  ],
  "cleanUrls": true,
  "trailingSlash": false
}
```

##### Netlify

Create `netlify.toml` or `_redirects`:

```toml
# netlify.toml
[[redirects]]
  from = "/user/*"
  to = "/user/index.html"
  status = 200

[[redirects]]
  from = "/posts/*"
  to = "/posts/index.html"
  status = 200

# SPA fallback (optional)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Or use `_redirects` file:

```
/user/*    /user/index.html    200
/posts/*   /posts/index.html   200
```

##### GitHub Pages

GitHub Pages doesn't support rewrites, but you can use a workaround with `404.html`:

1. Copy your `index.html` to `404.html`
2. GitHub will serve `404.html` for all unknown routes
3. RouterX will handle the routing client-side

**Better option:** Use hash mode for GitHub Pages—it works without any configuration.

##### Cloudflare Pages

Create `_redirects` file:

```
/user/*    /user/index.html    200
/posts/*   /posts/index.html   200
```

---

#### Self-Hosted Servers

##### Nginx

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    index index.html;

    # Serve static files directly
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Dynamic route rewrites
    location ~ ^/user/[^/]+$ {
        try_files $uri /user/index.html;
    }

    location ~ ^/posts/[^/]+$ {
        try_files $uri /posts/index.html;
    }

    location ~ ^/posts/[^/]+/comments/[^/]+$ {
        try_files $uri /posts/index.html;
    }

    # SPA fallback (if needed)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Custom 404
    error_page 404 /404.html;
}
```

##### Apache (.htaccess)

```apache
RewriteEngine On
RewriteBase /

# Don't rewrite existing files or directories
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Dynamic route rewrites
RewriteRule ^user/[^/]+$ /user/index.html [L]
RewriteRule ^posts/[^/]+$ /posts/index.html [L]
RewriteRule ^posts/[^/]+/comments/[^/]+$ /posts/index.html [L]

# SPA fallback (optional)
RewriteRule ^(.*)$ /index.html [L]
```

##### Node.js / Express (Production)

```js
// server.js
import express from 'express';
import path from 'path';
import compression from 'compression';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

// Enable gzip compression
app.use(compression());

// Cache static assets
app.use(express.static(__dirname, {
  maxAge: '1y',
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Dynamic route rewrites
app.get('/user/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'user/index.html'));
});

app.get('/posts/:postId', (req, res) => {
  res.sendFile(path.join(__dirname, 'posts/index.html'));
});

app.get('/posts/:postId/comments/:commentId', (req, res) => {
  res.sendFile(path.join(__dirname, 'posts/index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
});
```

---

### How Rewrites Preserve URL Data

When a rewrite rule matches (e.g., `/user/42?ref=email` → `/user/index.html`):

1. The **server** serves the HTML file
2. The **browser** keeps the original URL in the address bar
3. **RouterX** reads the full URL and extracts:
   - `params.id` = `"42"`
   - `query.ref` = `"email"`

Query strings and hash fragments are automatically preserved through rewrites.

### Quick Reference: Choosing Your Setup

| Scenario | Recommended Setup |
|----------|-------------------|
| Local development | Vite or Express dev server |
| Simple static hosting | Hash mode (no config needed) |
| Vercel / Netlify | Rewrite rules in config file |
| GitHub Pages | Hash mode or 404.html workaround |
| Self-hosted with Nginx | `try_files` directive |
| Self-hosted with Apache | `.htaccess` rewrite rules |
| Node.js server | Express with route handlers |

---

## When to Use Path Params vs Query Parameters vs Hash Fragments

 
> In routing, "path parameters", "query parameters", and "hash fragments" all convey data in the URL, but they serve different semantic roles. Here's when to prefer one over the others:

### Path Params (e.g. `/users/:id`)

#### Resource Identification

  Use params to name or locate a specific resource in your URL hierarchy.

- `/users/42` → load user #42  
- `/posts/123/comments/456` → load comment #456 of post #123

#### Hierarchical/Nested Data

  If one resource naturally “lives inside” another, represent that as part of the path.

- `/projects/:projectId/tasks/:taskId`

#### SEO & Readability

  Cleaner, more human-friendly URLs help search engines and users see structure at a glance.  

### Query Params (e.g. `?sort=asc&page=2`)

#### Optional Filtering & Sorting

  When you’re not selecting a “single” resource, but rather configuring how you view or slice a collection.

- `/products?category=shoes&sort=price_desc`

#### Pagination

  Page numbers, page sizes, cursors: these modify *which subset* of a collection you see.

- `/posts?page=3&per_page=10`

#### Non-Hierarchical Flags & Settings

Feature toggles, search terms, or other flags that don’t map to a hierarchy.

- `/search?query=routerx&highlight=true`  

### Hash Fragments (e.g. `#section1`, `#comments`)

#### Page Sections & Anchors

Use hash fragments to link to specific sections within a page or document.

- `/docs#installation` → scroll to installation section  
- `/article/123#comments` → jump to comments section  

#### UI State (Client-Side Only)

Modal states, tab selections, or other UI state that doesn't require server awareness.

- `/dashboard#settings-modal` → show settings modal  
- `/profile#edit-mode` → switch to edit mode

#### Single-Page Section

For traditional websites with anchor navigation within long pages.

- `/terms#privacy` → scroll to privacy section in terms page  

### Mixing All Three

Often you'll combine them:  

```bash
  /users/:userId/posts?page=2&sort=date#comments
```

— path identifies the user, query params paginate their posts, hash jumps to comments section.

### When to Avoid One or the Other

- Don't stuff identifiers into query strings when they represent the core resource:  
❌ `/page?id=42` (less clear)  
✅ `/page/42`  
- Don't put filters into your path:  
❌ `/products/price_asc`  
✅ `/products?sort=price_asc`  
- Don't use hash for server-side data:  
❌ `/posts#id=123` (server can't see hash)  
✅ `/posts/123#summary`  

### Summary

- **Params** = mandatory, structural IDs and nesting.  
- **Query** = optional, non-structural modifiers, filters, pagination, flags.  
- **Hash** = client-side anchors, UI state, page sections (invisible to server).  

By following this guideline, your URLs will be both semantic and predictable—making them easier to consume in routerx (via `params`, `query`, and `hash`) for comprehensive URL handling.

## Plugin system

RouterX provides a powerful plugin system that allows you to extend router functionality, add custom behavior, and integrate third-party libraries seamlessly. Plugins can hook into router lifecycle events, modify navigation behavior, add custom methods, and enhance route handling.

### Using Plugins

Plugins are registered using the `use()` method, which accepts a plugin factory function and optional configuration:

```js
import { RouterX } from './src/routerx.js';

const router = new RouterX();

// Register a plugin with default options
router.use(MyPlugin);

// Register a plugin with configuration
router.use(AnalyticsPlugin, { trackingId: 'UA-123456' });

// Chain multiple plugins
router
  .use(AuthPlugin, { redirectTo: '/login' })
  .use(AnalyticsPlugin, { enabled: true })
  .use(LoggingPlugin, { level: 'debug' });

router.start();
```

### Plugin Structure

A plugin is a factory function that returns a plugin object with lifecycle hooks and optional methods:

```js
function MyPlugin(options = {}) {
  return {
    name: 'my-plugin',
    
    // Called when plugin is registered
    init(router) {
      console.log('Plugin initialized', options);
    },
    
    // Lifecycle hooks
    hooks: {
      // Before route navigation
      beforeNavigate(path, query, hash) {
        // Return false to cancel navigation
        // Return a new path string to redirect
        // Return undefined/null to continue
      },
      
      // After route navigation completes
      afterNavigate(path, query, hash, params) {
        // Called after route handler executes
      },
      
      // Before route handler executes
      beforeRoute(pattern, handler, params, query, hash) {
        // Modify params, query, or hash before handler runs
      },
      
      // After route handler executes
      afterRoute(pattern, handler, params, query, hash) {
        // Cleanup or post-processing
      },
      
      // When 404 is triggered
      onNotFound(path, query, hash) {
        // Custom 404 handling
      },
      
      // When route guard blocks navigation
      onGuardBlocked(path, reason) {
        // Handle blocked navigation
      }
    },
    
    // Add custom methods to router instance
    methods: {
      customMethod() {
        // Access router via 'this'
        return this.current;
      }
    },
    
    // Cleanup when router is destroyed
    destroy() {
      // Cleanup code
    }
  };
}
```

### Built-in Plugin Examples

#### Analytics Plugin

Track page views and navigation events:

```js
function AnalyticsPlugin({ trackingId, enabled = true } = {}) {
  if (!enabled) return { name: 'analytics', init: () => {} };
  
  return {
    name: 'analytics',
    hooks: {
      afterNavigate(path, query, hash) {
        // Track page view
        if (window.gtag) {
          window.gtag('config', trackingId, {
            page_path: path + (query ? '?' + new URLSearchParams(query).toString() : ''),
            page_location: window.location.href
          });
        }
        
        // Or use custom analytics
        if (window.analytics) {
          window.analytics.track('Page View', {
            path,
            query,
            hash
          });
        }
      }
    }
  };
}

// Usage
router.use(AnalyticsPlugin, { trackingId: 'GA-123456' });
```

#### Authentication Plugin

Automatically protect routes and redirect unauthorized users:

```js
function AuthPlugin({ 
  redirectTo = '/login',
  protectedRoutes = ['/admin', '/dashboard'],
  checkAuth = () => false 
} = {}) {
  return {
    name: 'auth',
    hooks: {
      beforeNavigate(path, query, hash) {
        // Check if route is protected
        const isProtected = protectedRoutes.some(route => 
          path.startsWith(route)
        );
        
        if (isProtected && !checkAuth()) {
          // Redirect to login, preserving intended destination
          return `${redirectTo}?redirect=${encodeURIComponent(path)}`;
        }
      }
    }
  };
}

// Usage
router.use(AuthPlugin, {
  redirectTo: '/login',
  protectedRoutes: ['/admin', '/dashboard', '/profile'],
  checkAuth: () => {
    return localStorage.getItem('authToken') !== null;
  }
});
```

#### Logging Plugin

Debug router behavior and track navigation:

```js
function LoggingPlugin({ level = 'info', prefix = '[RouterX]' } = {}) {
  const log = (msg, data) => {
    if (level === 'debug' || level === 'info') {
      console.log(`${prefix} ${msg}`, data);
    }
  };
  
  return {
    name: 'logging',
    hooks: {
      beforeNavigate(path, query, hash) {
        log('Navigating to:', { path, query, hash });
      },
      afterNavigate(path, query, hash, params) {
        log('Navigation complete:', { path, query, hash, params });
      },
      beforeRoute(pattern, handler, params, query, hash) {
        log('Route matched:', { pattern, params, query, hash });
      },
      onNotFound(path, query, hash) {
        log('Route not found:', { path, query, hash });
      }
    }
  };
}

// Usage
router.use(LoggingPlugin, { level: 'debug' });
```

#### Scroll Restoration Plugin

Automatically restore scroll position when navigating back/forward:

```js
function ScrollRestorationPlugin({ 
  enabled = true,
  saveDelay = 100 
} = {}) {
  const scrollPositions = new Map();
  
  return {
    name: 'scroll-restoration',
    init(router) {
      if (!enabled) return;
      
      // Save scroll position before navigation
      router.before(() => {
        const key = router.current?.path || window.location.pathname;
        scrollPositions.set(key, {
          x: window.scrollX,
          y: window.scrollY,
          timestamp: Date.now()
        });
      });
      
      // Restore scroll position after navigation
      router.after(() => {
        setTimeout(() => {
          const key = router.current?.path;
          const saved = scrollPositions.get(key);
          
          if (saved) {
            window.scrollTo(saved.x, saved.y);
          } else {
            // Scroll to top for new pages
            window.scrollTo(0, 0);
          }
        }, saveDelay);
      });
    }
  };
}

// Usage
router.use(ScrollRestorationPlugin, { saveDelay: 150 });
```

#### Loading Indicator Plugin

Show loading state during route transitions:

```js
function LoadingPlugin({ 
  selector = '#loading',
  delay = 100 
} = {}) {
  let loadingElement = null;
  let timeoutId = null;
  
  return {
    name: 'loading',
    init(router) {
      loadingElement = document.querySelector(selector);
      
      router.before(() => {
        timeoutId = setTimeout(() => {
          if (loadingElement) {
            loadingElement.style.display = 'block';
          }
        }, delay);
      });
      
      router.after(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (loadingElement) {
          loadingElement.style.display = 'none';
        }
      });
    }
  };
}

// Usage
router.use(LoadingPlugin, { selector: '#page-loader', delay: 200 });
```

### Advanced Plugin Patterns

#### Plugin with State Management

```js
function StatePlugin() {
  const state = {
    history: [],
    currentIndex: -1
  };
  
  return {
    name: 'state',
    init(router) {
      router.after(() => {
        state.history.push({
          path: router.current?.path,
          timestamp: Date.now()
        });
        state.currentIndex = state.history.length - 1;
      });
    },
    methods: {
      getHistory() {
        return [...state.history];
      },
      getHistoryItem(index) {
        return state.history[index];
      }
    }
  };
}

router.use(StatePlugin);
console.log(router.getHistory());
```

#### Conditional Plugin Registration

```js
function ConditionalPlugin({ condition, plugin, options }) {
  if (!condition()) {
    return { name: 'conditional', init: () => {} };
  }
  
  return plugin(options);
}

// Only enable analytics in production
router.use(ConditionalPlugin, {
  condition: () => process.env.NODE_ENV === 'production',
  plugin: AnalyticsPlugin,
  options: { trackingId: 'GA-123456' }
});
```

#### Plugin Composition

Combine multiple plugins into a single plugin:

```js
function ComposedPlugin(options) {
  const analytics = AnalyticsPlugin(options.analytics);
  const logging = LoggingPlugin(options.logging);
  const auth = AuthPlugin(options.auth);
  
  return {
    name: 'composed',
    init(router) {
      analytics.init?.(router);
      logging.init?.(router);
      auth.init?.(router);
    },
    hooks: {
      beforeNavigate(...args) {
        const results = [
          analytics.hooks?.beforeNavigate?.(...args),
          logging.hooks?.beforeNavigate?.(...args),
          auth.hooks?.beforeNavigate?.(...args)
        ].filter(Boolean);
        
        // Return first non-undefined result
        return results[0];
      },
      afterNavigate(...args) {
        analytics.hooks?.afterNavigate?.(...args);
        logging.hooks?.afterNavigate?.(...args);
        auth.hooks?.afterNavigate?.(...args);
      }
    },
    methods: {
      ...analytics.methods,
      ...logging.methods,
      ...auth.methods
    }
  };
}
```

### Plugin Best Practices

1. **Always return a plugin object** - Even if the plugin is disabled, return an object with at least a `name` property.

2. **Use descriptive names** - Plugin names should be unique and descriptive for debugging.

3. **Handle errors gracefully** - Wrap plugin logic in try-catch blocks to prevent breaking the router.

4. **Clean up resources** - Implement `destroy()` hook to clean up event listeners, timers, or subscriptions.

5. **Document plugin options** - Provide clear documentation for plugin configuration options.

6. **Test plugins independently** - Ensure plugins work in isolation before combining them.

7. **Avoid side effects in init** - Keep `init()` lightweight; defer heavy operations to hooks.

### Plugin Execution Order

Plugins are executed in registration order:

```js
router
  .use(PluginA)  // Executes first
  .use(PluginB)  // Executes second
  .use(PluginC); // Executes third
```

When multiple plugins hook into the same event, they execute in registration order. If a `beforeNavigate` hook returns a redirect path, subsequent plugins still execute, but the redirect takes precedence.

### Checking Plugin Registration

```js
// Check if a plugin is registered
if (router.hasPlugin('analytics')) {
  console.log('Analytics plugin is active');
}

// Get all registered plugins
const plugins = router.getPlugins();
console.log('Registered plugins:', plugins.map(p => p.name));
```

## Security Considerations

RouterX is a minimal client-side routing library and does not inherently introduce vulnerabilities. It includes built-in sanitization methods to help you handle user input safely.

### Built-in Sanitization Methods

RouterX provides three methods to sanitize URL data from the address bar:

**sanitize(value)** - Encode HTML entities for safe display:

```js
router.on('/user/:id', (params) => {
  // Safe: HTML entities are encoded
  el.innerHTML = router.sanitize(params.id);
  
  // Input: <script>alert(1)</script>
  // Output: &lt;script&gt;alert(1)&lt;&#x2F;script&gt;
});
```

**sanitizePath(path, options)** - Normalize paths and block dangerous protocols:

```js
// Normalizes path traversal attempts
router.sanitizePath('/user/../admin');       // Returns: '/admin'
router.sanitizePath('/../../../etc/passwd'); // Returns: '/'

// Blocks dangerous protocols
router.sanitizePath('javascript:alert(1)');  // Returns: '/'
router.sanitizePath('data:text/html,<h1>');  // Returns: '/'

// Handles encoded attacks
router.sanitizePath('%2e%2e%2fadmin');        // Returns: '/admin'

// Custom options
router.sanitizePath(userInput, {
  allowedProtocols: ['https'],  // Only allow https:// URLs
  fallback: '/home'             // Return this if invalid
});
```

**isUrlSafe(url, allowedProtocols)** - Validate URLs before use:

```js
// Check before redirecting
const redirectUrl = query.redirect;
if (router.isUrlSafe(redirectUrl)) {
  router.navigate(redirectUrl);
} else {
  router.navigate('/');
}

// Validate external links
router.isUrlSafe('https://example.com');      // true
router.isUrlSafe('javascript:alert(1)');      // false
router.isUrlSafe('data:text/html,<script>');  // false

// Custom allowed protocols
router.isUrlSafe('ftp://files.com', ['http', 'https', 'ftp']); // true
```

### Best Practices

**Treat URL Data as Untrusted** - Path params and query strings come directly from the address bar. Always sanitize before using in sensitive operations:

```js
router.on('/search', (params, query) => {
  // Sanitize before display
  resultsEl.innerHTML = `Results for: ${router.sanitize(query.q)}`;
  
  // Validate before API calls
  const safeQuery = router.sanitize(query.q);
  fetch(`/api/search?q=${encodeURIComponent(safeQuery)}`);
});
```

**Validate Redirect URLs** - Always check URLs before redirecting:

```js
router.on('/login', (params, query) => {
  // After successful login...
  const returnUrl = query.return || '/dashboard';
  
  // Validate before redirect to prevent open redirect attacks
  if (router.isUrlSafe(returnUrl) && returnUrl.startsWith('/')) {
    router.navigate(returnUrl);
  } else {
    router.navigate('/dashboard');
  }
});
```

**Use Route Guards for Authorization** - Protect sensitive routes:

```js
router.guard('/admin/:section', async (params, query) => {
  const user = await getCurrentUser();
  return user && user.role === 'admin';
}, () => router.navigate('/login'));
```

### Additional Notes

- **No eval or Dynamic Code** - RouterX simply matches strings and returns objects; it does not execute code from URLs.
- **History API and CSRF** - Using `history.pushState` does not alter cookies or headers. CSRF vectors remain unchanged from standard page navigation.

By using the built-in sanitization methods and following these practices, you ensure RouterX integrates securely into your app.

### Security Audit Summary

RouterX has been audited for common web vulnerabilities and includes built-in protections:

#### Protected Against

| Vulnerability Type | Status | Protection Method |
|-------------------|--------|-------------------|
| **Prototype Pollution** | ✅ Protected | `_safeObjectFromEntries()`, filtering in `_parseParams()` and `buildUrl()` |
| **XSS (Cross-Site Scripting)** | ✅ Protected | `sanitize()` method for HTML entity encoding |
| **Path Traversal** | ✅ Protected | `sanitizePath()` method with normalization |
| **Open Redirect** | ✅ Protected | Validation in `navigate()`, `replace()`, `navigateWithHash()` |
| **Code Injection** | ✅ Protected | No dangerous APIs (`eval`, `Function`, `innerHTML`) used |
| **DoS (Malformed URLs)** | ✅ Protected | Try-catch around `decodeURIComponent()` |
| **Dangerous Protocols** | ✅ Protected | `isUrlSafe()` method blocks `javascript:`, `data:`, etc. |

#### Security Features

**Automatic Prototype Pollution Prevention**

- Query string parsing filters dangerous keys (`__proto__`, `constructor`, `prototype`)
- Route parameter keys are validated and filtered
- URL building excludes prototype pollution keys

**Navigation Security**

- All navigation methods (`navigate()`, `replace()`, `navigateWithHash()`) validate paths
- Dangerous protocols are automatically blocked
- Invalid paths are rejected with warnings

**Error Handling**

- Malformed URI encoding is handled gracefully (prevents crashes)
- Invalid input types are validated before processing
- Security violations log warnings without breaking functionality

#### Developer Recommendations

1. **Always sanitize user input** - Use `router.sanitize()` before displaying URL parameters
2. **Validate redirect URLs** - Use `router.isUrlSafe()` before redirecting to user-provided URLs
3. **Sanitize paths** - Use `router.sanitizePath()` when paths come from user input
4. **Use route guards** - Protect sensitive routes with `router.guard()` for authentication/authorization

RouterX is production-ready with comprehensive security protections built-in.

---

## License

RouterX is **dual-licensed** to support both open-source and commercial use.

### Open-Source / Non-Commercial Use

RouterX is available under the **MIT License** for:

- ✅ Open-source projects (OSI-approved licenses)
- ✅ Personal projects and non-revenue generating applications
- ✅ Educational purposes and academic research
- ✅ Non-profit organizations
- ✅ Internal company tools (non-revenue generating)
- ✅ Prototypes and MVPs

See [LICENSE](./LICENSE) and [LICENSE-NONCOMMERCIAL.md](./LICENSE-NONCOMMERCIAL.md) for full details.

### Commercial Use

A **commercial license** is required for:

- ❌ Proprietary software and closed-source commercial applications
- ❌ SaaS products and revenue-generating applications
- ❌ Enterprise deployments and large-scale corporate use
- ❌ White-label products sold or licensed to third parties

**Commercial licenses include:**

- Legal protection and indemnification
- Priority support and SLA
- Updates and bug fixes during license term
- Custom licensing terms for enterprise needs

See [EULA-COMMERCIAL.md](./EULA-COMMERCIAL.md) for commercial licensing terms.

### Licensing Inquiries

**For commercial licensing, pricing, or questions:**
- **Email:** ynck.chrl@protonmail.com

We're happy to discuss licensing options that fit your needs.