export const signals = ['live', 'field', 'alert', 'pipeline', 'landscape', 'meta'];

export const signalLabels = {
  live:      'LIVE',
  field:     'FIELD NOTE',
  alert:     'ALERT',
  pipeline:  'PIPELINE',
  landscape: 'LANDSCAPE',
  meta:      'META',
};

export const signalAccent = {
  live:      '--blog-signal-live',
  field:     '--blog-signal-field',
  alert:     '--blog-signal-alert',
  pipeline:  '--blog-signal-pipeline',
  landscape: '--blog-signal-landscape',
  meta:      '--blog-signal-meta',
};

export const topics = [
  'web-api',
  'web-standards',
  'css',
  'javascript',
  'html-dom',
  'browsers',
  'security',
  'performance',
  'backend',
];

export const topicLabels = {
  'web-api':       'Web API',
  'web-standards': 'Web Standards',
  'css':           'CSS',
  'javascript':    'JavaScript',
  'html-dom':      'HTML / DOM',
  'browsers':      'Browsers',
  'security':      'Security',
  'performance':   'Performance',
  'backend':       'Backend / Ops',
};

export const posts = [
  {
    slug: 'css-grid-mastery',
    title: 'CSS Grid Mastery: Patterns You\'re Not Using Yet',
    excerpt: 'Named lines, subgrid, dense packing, and the one-liner responsive layout that needs no media queries.',
    signal: 'field',
    topics: ['css'],
    date: '2026-06-18',
    readTime: 5,
  },
  {
    slug: 'javascript-temporal-api',
    title: 'The Temporal API: JavaScript Date Done Right',
    excerpt: 'Stage 3 and shipping. Why Temporal replaces every date library you\'ve ever used.',
    signal: 'live',
    topics: ['web-api', 'javascript'],
    date: '2026-06-14',
    readTime: 6,
  },
  {
    slug: 'view-transitions-api',
    title: 'View Transitions API: Native Page Animations Without JavaScript',
    excerpt: 'Cross-document transitions with a single CSS rule. The biggest MPA UX improvement since Service Workers.',
    signal: 'live',
    topics: ['web-api', 'html-dom', 'performance'],
    date: '2026-06-10',
    readTime: 5,
  },
  {
    slug: 'chrome-devtools-2026',
    title: 'Chrome DevTools in 2026: Features That Changed My Debugging Workflow',
    excerpt: 'Flamechart INP insights, local overrides that work with TypeScript source maps, and the new memory leak detector.',
    signal: 'field',
    topics: ['browsers', 'performance'],
    date: '2026-05-28',
    readTime: 6,
  },
  {
    slug: 'wasm-gc-2026',
    title: 'WebAssembly GC: Writing Real Apps in Wasm Without C',
    excerpt: 'Kotlin and Dart now compile to Wasm without bundling their own GC. Flutter Web\'s output is 10× smaller.',
    signal: 'live',
    topics: ['web-api', 'performance'],
    date: '2026-04-30',
    readTime: 7,
  },
  {
    slug: 'css-anchor-positioning',
    title: 'CSS Anchor Positioning: Tooltips and Popovers Without JavaScript',
    excerpt: 'The feature that makes Popper.js and Floating UI largely unnecessary. Native positioned overlays with automatic flip fallbacks.',
    signal: 'live',
    topics: ['css', 'web-api'],
    date: '2026-05-20',
    readTime: 5,
  },
  {
    slug: 'browser-fingerprinting-2026',
    title: 'How Browsers Identify You Without Cookies',
    excerpt: 'Canvas, WebGL, and the entropy arms race. What fingerprinting libraries actually do and what browsers do to stop them.',
    signal: 'alert',
    topics: ['security', 'browsers'],
    date: '2026-03-15',
    readTime: 6,
  },
  {
    slug: 'javascript-decorators-stage3',
    title: 'JavaScript Decorators at Stage 3: What You Need to Know',
    excerpt: 'The spec is stable. How the standard decorators differ from TypeScript\'s legacy experimentalDecorators and what they replace.',
    signal: 'pipeline',
    topics: ['javascript', 'web-standards'],
    date: '2026-06-05',
    readTime: 7,
  },
  {
    slug: 'html-popover-api',
    title: 'The Popover API: Native Overlays Without JavaScript',
    excerpt: 'Accessible, keyboard-navigable, top-layer overlays as a platform feature. No z-index battles. No focus trapping code.',
    signal: 'live',
    topics: ['web-api', 'html-dom'],
    date: '2026-04-12',
    readTime: 5,
  },
  {
    slug: 'css-container-queries-advanced',
    title: 'CSS Container Queries: Beyond Basic Width',
    excerpt: 'Style queries, container units (cqi, cqb), named containers, and the Web Component use case that makes everything click.',
    signal: 'field',
    topics: ['css'],
    date: '2026-06-01',
    readTime: 6,
  },
  {
    slug: 'x86-to-arm-transition',
    title: 'The ARM Architecture Transition: Where We Are in 2026',
    excerpt: 'Apple Silicon is solved. Windows ARM is viable. Graviton4 is the server default. Here\'s the developer checklist.',
    signal: 'landscape',
    topics: ['backend'],
    date: '2026-05-10',
    readTime: 7,
  },
  {
    slug: 'passkeys-replacing-passwords',
    title: 'Passkeys Are Replacing Passwords: A Technical Deep Dive',
    excerpt: 'How public-key cryptography makes phishing impossible. The WebAuthn flow, device-bound vs synced passkeys, and recovery.',
    signal: 'live',
    topics: ['web-api', 'security'],
    date: '2026-03-22',
    readTime: 8,
  },
  {
    slug: 'css-houdini-paint',
    title: 'CSS Houdini Paint API: Drawing With CSS',
    excerpt: 'Write JavaScript that acts as a CSS image. Animated borders, texture generators, and the inputProperties bridge.',
    signal: 'field',
    topics: ['css'],
    date: '2026-02-18',
    readTime: 6,
  },
  {
    slug: 'firefox-vs-chrome-2026',
    title: 'Firefox vs Chrome in 2026: The State of Browser Competition',
    excerpt: 'Market share, technical strengths, the Chromium monoculture risk, and why you should run both.',
    signal: 'landscape',
    topics: ['browsers'],
    date: '2026-06-20',
    readTime: 6,
  },
  {
    slug: 'javascript-signals-tc39',
    title: 'JavaScript Signals: TC39 Reactive Primitives',
    excerpt: 'The signal proposal that could unify SolidJS, Vue, Angular, and Preact on a common reactive primitive.',
    signal: 'pipeline',
    topics: ['javascript', 'web-standards'],
    date: '2026-05-05',
    readTime: 7,
  },
  {
    slug: 'html-speculation-rules',
    title: 'Speculation Rules API: Instant Page Navigation',
    excerpt: 'Pre-render entire pages in the background. When the user clicks, it\'s a swap not a load. Sub-100ms LCP on navigation.',
    signal: 'live',
    topics: ['web-api', 'performance'],
    date: '2026-06-25',
    readTime: 5,
  },
  {
    slug: 'css-color-mix-relative',
    title: 'CSS color-mix() and Relative Color Syntax',
    excerpt: 'Mix colors in oklch, derive lighter and muted variants with relative syntax, native Sass-style color functions in CSS.',
    signal: 'live',
    topics: ['css'],
    date: '2026-06-22',
    readTime: 5,
  },
  {
    slug: 'html-custom-elements-v2',
    title: 'Custom Elements v2: What\'s New in the Spec',
    excerpt: 'Form-associated custom elements, ElementInternals ARIA, custom state pseudo-classes, and what\'s coming with ::theme().',
    signal: 'pipeline',
    topics: ['html-dom', 'web-standards'],
    date: '2026-05-15',
    readTime: 6,
  },
  {
    slug: 'html-template-element',
    title: 'The <template> Element: The Most Underused API in the Browser',
    excerpt: 'Inert DocumentFragments, valid table/SVG parsing, Declarative Shadow DOM, nested template libraries, and the clone patterns most codebases skip.',
    signal: 'field',
    topics: ['html-dom', 'web-api', 'javascript'],
    date: '2026-07-02',
    readTime: 9,
  },
  {
    slug: 'third-party-cookies-2026',
    title: 'Third-Party Cookies Are Gone: The Web\'s Privacy Landscape in 2026',
    excerpt: 'Chrome finished the deprecation. Safari and Firefox blocked years ago. What broke, what replaced it, and the developer checklist for a post-cookie web.',
    signal: 'landscape',
    topics: ['security', 'browsers', 'web-standards'],
    date: '2026-07-03',
    readTime: 7,
  },
  {
    slug: 'javascript-template-literals',
    title: 'Template Literals: The JavaScript Feature You Think You Know',
    excerpt: 'Tagged templates, String.raw, SQL builders, safe HTML boundaries, and the compile-hook superpower hiding inside backticks.',
    signal: 'field',
    topics: ['javascript', 'web-standards'],
    date: '2026-07-04',
    readTime: 12,
  },
  {
    slug: 'eme-api',
    title: 'The EME API: Encrypted Media in the Browser',
    excerpt: 'How Encrypted Media Extensions bridge your player to Widevine, PlayReady, and FairPlay — and what you integrate vs leave to Shaka.',
    signal: 'field',
    topics: ['web-api', 'security', 'html-dom'],
    date: '2026-07-16',
    readTime: 8,
  },
  {
    slug: 'template-element-ssr',
    title: 'Using the <template> Element for SSR',
    excerpt: 'Template banks in HTML responses, Declarative Shadow DOM on first paint, islands hydration, and why clone beats innerHTML after server render.',
    signal: 'field',
    topics: ['html-dom', 'web-api', 'performance'],
    date: '2026-07-21',
    readTime: 9,
  },
  {
    slug: 'css-injection-data-exfil',
    title: 'CSS Injection: How Stylesheets Steal Data Without JavaScript',
    excerpt: 'Attribute selectors, background URLs, and @import chains turn user-controlled CSS into a DOM oracle with network egress. Why HTML sanitization alone fails and what CSP must cover.',
    signal: 'alert',
    topics: ['css', 'security', 'html-dom'],
    date: '2026-07-22',
    readTime: 7,
  },
  {
    slug: 'mpa-comeback',
    title: 'The MPA Comeback: Why HTML-First Beat the SPA Default',
    excerpt: 'View Transitions, Speculation Rules, islands, and the bundle-size bill that pushed document-shaped sites back to many good pages instead of one big app.',
    signal: 'meta',
    topics: ['html-dom', 'performance', 'web-api'],
    date: '2026-07-21',
    readTime: 8,
  },
  {
    slug: 'duckdb-advantages',
    title: 'DuckDB: Why In-Process Analytics Is Having a Moment',
    excerpt: 'Embedded OLAP, native Parquet, zero infrastructure, and DuckDB-Wasm in the browser. When to reach for it and when Postgres still wins.',
    signal: 'field',
    topics: ['backend', 'performance', 'javascript'],
    date: '2026-07-01',
    readTime: 7,
  },
  {
    slug: 'quantum-computing-web-devs',
    title: 'Quantum Computing for Web Developers: What You Actually Need to Know',
    excerpt: 'Shor\'s algorithm, post-quantum TLS, and what you need to do now vs what can wait.',
    signal: 'meta',
    topics: ['security', 'web-standards', 'backend'],
    date: '2026-04-05',
    readTime: 6,
  },
];

export function getPostAccent(post) {
  const token = signalAccent[post.signal]
  return token ? `var(${token})` : 'var(--blog-accent)'
}

export function getPostSignalLabel(post) {
  return signalLabels[post.signal];
}

export function getPostTopicLabels(post) {
  return post.topics.map(t => topicLabels[t]);
}

export function formatTopicsAttr(post) {
  return getPostTopicLabels(post).join('|');
}

/** Default: `{date}_{slug}.md`. Override with optional `post.articleFile`. */
export function getArticleFile(post) {
  if (post.articleFile) return post.articleFile;
  return `${post.date}_${post.slug}.md`;
}

export function getLatestPosts(limit = 3) {
  return [...posts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

/** "JULY 2026" from the newest post date (UTC month to match ISO dates). */
export function getBroadcastLabel() {
  const latest = getLatestPosts(1)[0];
  const iso = latest?.date ?? new Date().toISOString().slice(0, 10);
  const [year, month] = iso.split('-').map(Number);
  const monthName = new Date(Date.UTC(year, month - 1, 1))
    .toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })
    .toUpperCase();
  return `${monthName} ${year}`;
}

export function getPost(slug) {
  return posts.find(p => p.slug === slug) || null;
}

export function getPostsBySignal(signal) {
  return posts.filter(p => p.signal === signal);
}

export function getPostsByTopic(topic) {
  return posts.filter(p => p.topics.includes(topic));
}

export function filterPosts({ signal = null, topic = null } = {}) {
  return posts
    .filter(p => {
      if (signal && p.signal !== signal) return false;
      if (topic && !p.topics.includes(topic)) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}
