import { observeThemeModeRoot } from '/__src/js/theme-mode-host.js';

class blogTopBar extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  get _activePage() {
    const path = window.location.pathname
    if (path.includes('/posts/') || path.includes('/post/')) return 'posts'
    if (path.includes('/about')) return 'about'
    if (path.includes('/links')) return 'links'
    return 'home'
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = this._HTML
    this._themeObserver = observeThemeModeRoot(this)
    this._initTheme()
    this._highlightActive()
    this._initBurger()
  }

  disconnectedCallback() {
    this._themeObserver?.disconnect()
    if (this._outsideClick) document.removeEventListener('click', this._outsideClick)
  }

  _initTheme() {
    const toggle = this.shadowRoot.querySelector('#blog-theme-toggle')
    if (!toggle) return
    const root = document.documentElement
    const saved = localStorage.getItem('theme-mode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = saved === 'dark' || (!saved && prefersDark)
    toggle.checked = isDark
    root.setAttribute('theme-mode', isDark ? 'dark' : 'light')
    toggle.addEventListener('change', () => {
      const dark = toggle.checked
      root.setAttribute('theme-mode', dark ? 'dark' : 'light')
      localStorage.setItem('theme-mode', dark ? 'dark' : 'light')
    })
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme-mode')) {
        toggle.checked = e.matches
        root.setAttribute('theme-mode', e.matches ? 'dark' : 'light')
      }
    })
  }

  _highlightActive() {
    const active = this._activePage
    this.shadowRoot.querySelectorAll(`[data-page="${active}"]`)
      .forEach(link => link.classList.add('--active'))
  }

  _initBurger() {
    const burger = this.shadowRoot.querySelector('.nav-burger')
    const drawer = this.shadowRoot.querySelector('.nav-drawer')
    const backdrop = this.shadowRoot.querySelector('.nav-drawer-backdrop')
    if (!burger || !drawer) return

    const close = () => {
      this.classList.remove('--open')
      burger.setAttribute('aria-expanded', 'false')
      drawer.setAttribute('aria-hidden', 'true')
      backdrop?.setAttribute('aria-hidden', 'true')
    }

    burger.addEventListener('click', (e) => {
      e.stopPropagation()
      const open = this.classList.toggle('--open')
      burger.setAttribute('aria-expanded', String(open))
      drawer.setAttribute('aria-hidden', String(!open))
      backdrop?.setAttribute('aria-hidden', String(!open))
    })

    backdrop?.addEventListener('click', close)

    this._outsideClick = (e) => {
      if (!this.contains(e.target)) close()
    }
    document.addEventListener('click', this._outsideClick)
  }

  get _HTML() {
    return `
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        position: sticky;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        display: block;
        height: var(--top-bar-height, calc(var(--space-unit, 0.5rem) * 6));
        color: var(--blog-color-fg);
        font-family: var(--ff-2, 'Syncopate', sans-serif);
        container-type: inline-size;
        container-name: top-bar;
      }

      /*
        Bar chrome lives on its own layer (sibling of .nav-drawer, not an
        ancestor). If :host itself carried backdrop-filter, it would become
        a "backdrop root" and trap .nav-drawer's own blur inside the shadow
        tree instead of letting it sample the real page behind it.
      */
      .bar-chrome {
        position: absolute;
        inset: 0;
        z-index: 1;
        background: var(--blog-bg-bar);
        -webkit-backdrop-filter: blur(16px);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid var(--blog-accent-border-soft);
        box-shadow: 0 0 calc(var(--space-unit) * 4) var(--blog-accent-faint);
        pointer-events: none;
      }
      :host([theme-mode="light"]) .bar-chrome {
        background: hsla(from var(--blog-lightest) h s l / 0.8);
      }

      .bar {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: stretch;
        height: 100%;
        padding-inline: var(--page-padding-x, calc(var(--space-unit, 0.5rem) * 3));
        gap: calc(var(--space-unit) * 2);
        max-width: 75rem;
        margin: 0 auto;
      }

      .back-to-demos {
        display: flex;
        align-items: center;
        align-self: center;
        gap: calc(var(--space-unit) * 1.5);
        text-decoration: none;
        flex-shrink: 0;
        opacity: 0.4;
        transition: opacity 0.2s;
      }

      .back-to-demos:hover {
        opacity: 1;
      }

      .back-to-demos svg {
        width: calc(var(--space-unit) * 5);
        height: auto;
        color: var(--blog-color-fg);
        flex-shrink: 0;
      }

      .back-label {
        font-family: var(--ff-3, 'JetBrains Mono', monospace);
        font-size: var(--f-size-t);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--blog-color-fg);
        white-space: nowrap;
      }

      .bar-sep {
        width: 1px;
        align-self: stretch;
        background: var(--blog-fg-border);
        flex-shrink: 0;
        margin-block: calc(var(--space-unit) * 1.5);
      }

      .logo {
        display: flex;
        align-items: center;
        align-self: center;
        gap: calc(var(--space-unit) * 2);
        text-decoration: none;
        flex-shrink: 0;
      }

      .logo-mark {
        font-family: var(--ff-3, 'JetBrains Mono', monospace);
        font-size: var(--f-size-s);
        letter-spacing: 0.12em;
        color: var(--blog-accent);
        text-shadow: 0 0 calc(var(--space-unit) * 2) var(--blog-accent-glow-strong);
        text-transform: uppercase;
        white-space: nowrap;
      }
      :host([theme-mode="light"]) .logo-mark {
        color: var(--blog-darkest);
      }

      .logo-sep {
        width: 1px;
        height: calc(var(--space-unit) * 3);
        background: var(--blog-accent-separator);
      }

      .logo-name {
        font-size: var(--f-size-s);
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--blog-color-fg);
      }

      .bar > nav {
        display: flex;
        align-items: stretch;
        gap: calc(var(--space-unit) * 1);
        margin-left: auto;
      }

      .bar > nav a {
        position: relative;
        display: flex;
        align-items: center;
        align-self: stretch;
        padding-inline: calc(var(--space-unit) * 1);
        font-size: var(--f-size-xs);
        font-family: var(--ff-2, 'Syncopate', sans-serif);
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        text-decoration: none;
        color: var(--blog-fg-nav);
        transition: color 0.2s;
      }

      .bar > nav a::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: calc(var(--space-unit) * 2);
        right: calc(var(--space-unit) * 2);
        height: 1px;
        background: var(--blog-accent);
        box-shadow: 0 0 calc(var(--space-unit) * 2) var(--blog-accent-glow-strong);
        transform: scaleX(0);
        transition: transform 0.2s;
      }
      :host([theme-mode="light"]) .bar > nav a::after {
        background: var(--blog-darkest);
        box-shadow: 0 0 calc(var(--space-unit) * 2) var(--blog-accent-glow-strong);
        height: 2px;
      }

      .bar > nav a:hover {
        color: var(--blog-color-fg);
      }

      .bar > nav a:hover::after,
      .bar > nav a.--active::after {
        transform: scaleX(1);
      }

      .bar > nav a.--active {
        color: var(--blog-accent);
      }
      :host([theme-mode="light"]) .bar > nav a.--active {
        color: var(--blog-darkest);
      }

      /* Burger — 2 lines, shown below 48rem (768px) */
      .nav-burger {
        display: none;
        align-items: center;
        justify-content: center;
        align-self: center;
        flex-shrink: 0;
        margin-left: auto;
        padding: calc(var(--space-unit) * 1);
        background: none;
        border: none;
        cursor: pointer;
        color: var(--blog-color-fg);
      }

      .nav-burger svg {
        width: calc(var(--space-unit) * 3);
        height: calc(var(--space-unit) * 3);
      }

      /* Mobile drawer — fixed overlay, out of document flow */
      .nav-drawer-backdrop {
        position: fixed;
        inset: 0;
        top: var(--top-bar-height, calc(var(--space-unit, 0.5rem) * 6));
        z-index: -1;
        background: hsl(from var(--blog-color-bg) h s l / 0.55);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.28s ease, visibility 0.28s ease;
      }

      .nav-drawer {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--blog-bg-bar);
        -webkit-backdrop-filter: blur(16px);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid var(--blog-accent-border-soft);
        box-shadow: 0 calc(var(--space-unit) * 4) calc(var(--space-unit) * 8) var(--blog-accent-faint);
        transform: translateY(-100%);
        pointer-events: none;
        transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
      }

      :host([theme-mode="light"]) .nav-drawer {
        background: hsla(from var(--blog-lightest) h s l / 0.92);
      }

      :host(.--open) .nav-drawer-backdrop {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }

      :host(.--open) .nav-drawer {
        transform: translateY(var(--top-bar-height, calc(var(--space-unit, 0.5rem) * 6)));
        pointer-events: auto;
      }

      .nav-drawer a {
        display: block;
        padding-block: calc(var(--space-unit) * 2.5);
        padding-inline: var(--page-padding-x, calc(var(--space-unit) * 3));
        font-size: var(--f-size-xs);
        font-family: var(--ff-2, 'Syncopate', sans-serif);
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        text-decoration: none;
        color: var(--blog-fg-nav);
        border-left: 2px solid transparent;
        transition: color 0.2s, background 0.2s, border-color 0.2s;
      }

      .nav-drawer a::after {
        content: none;
        display: none;
      }

      .nav-drawer a:hover {
        color: var(--blog-color-fg);
        background: var(--blog-fg-surface);
      }

      .nav-drawer a.--active {
        color: var(--blog-accent);
        border-left-color: var(--blog-accent);
        background: var(--blog-accent-bg);
      }

      :host([theme-mode="light"]) .nav-drawer a.--active {
        color: var(--blog-darkest);
        border-left-color: var(--blog-darkest);
      }

      @media (prefers-reduced-motion: reduce) {
        .nav-drawer,
        .nav-drawer-backdrop {
          transition: none !important;
        }
      }

      .theme-wrap {
        display: flex;
        align-items: center;
        align-self: center;
        padding-left: calc(var(--space-unit) * 2);
        border-left: 1px solid var(--blog-fg-border);
      }

      /* Theme toggle — same structure as site top-bar, blog tokens */
      .theme-mode {
        display: flex;
        align-items: center;
        cursor: pointer;
        height: 100%;
      }

      .theme-mode-input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }

      .theme-mode-track {
        position: relative;
        width: calc(var(--space-unit) * 6);
        height: calc(var(--space-unit) * 3);
        background-color: hsl(from var(--blog-color-fg) h s l / 0.15);
        border-radius: calc(var(--space-unit) * 2);
        transition: background-color 0.3s ease;
      }

      .theme-mode-thumb {
        position: absolute;
        top: 1px;
        left: 2px;
        width: calc(var(--space-unit) * 2.8);
        height: calc(var(--space-unit) * 2.8);
        background-color: var(--blog-color-bg);
        border-radius: 50%;
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .theme-icon {
        width: 70%;
        height: 70%;
        color: var(--blog-color-fg);
        transition: opacity 0.2s ease;
      }

      .theme-icon.sun { opacity: 1; }

      .theme-icon.moon {
        position: absolute;
        opacity: 0;
      }

      .theme-mode-input:checked + .theme-mode-track {
        background-color: hsl(from var(--blog-color-fg) h s l / 0.15);
      }

      .theme-mode-input:checked + .theme-mode-track .theme-mode-thumb {
        transform: translateX(calc(var(--space-unit) * 2.8));
      }

      .theme-mode-input:checked + .theme-mode-track .sun { opacity: 0; }

      .theme-mode-input:checked + .theme-mode-track .moon { opacity: 1; }

      @container top-bar (max-width: 48rem) {
        .bar > nav { display: none; }
        .nav-burger { display: flex; }
      }

      @container top-bar (max-width: 36rem) {
        .back-label,
        .logo-name { display: none; }
      }

      @container top-bar (min-width: 48.01rem) {
        .nav-drawer,
        .nav-drawer-backdrop {
          display: none !important;
        }
      }
    </style>

    <div class="bar-chrome" aria-hidden="true"></div>

    <div class="bar">
      <a href="/demos/blog/" class="logo">
        <span class="logo-mark">//</span>
        <span class="logo-name">nullsignal</span>
      </a>

      <div class="bar-sep"></div>

      <a href="/demos/" class="back-to-demos" title="Back to demos">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 28" aria-hidden="true">
          <style>.nl-mesh{fill:none;stroke:currentColor;stroke-width:1.5}</style>
          <polygon points="26.67 9.56 8.89 9.56 0 18.44 17.78 18.44 26.67 9.56" class="nl-mesh"/>
          <polygon points="80 9.56 62.22 9.56 53.33 18.44 71.11 18.44 80 9.56" class="nl-mesh"/>
          <polygon points="35.56 18.44 53.33 18.44 62.22 27.33 44.44 27.33 35.56 18.44" class="nl-mesh"/>
          <polygon points="26.67 9.56 44.44 9.56 53.33 18.44 35.56 18.44 26.67 9.56" class="nl-mesh"/>
          <polygon points="17.78 .67 35.56 .67 44.44 9.56 26.67 9.56 17.78 .67" class="nl-mesh"/>
          <polygon points="53.33 .67 71.11 .67 80 9.56 62.22 9.56 53.33 .67" class="nl-mesh"/>
          <polygon points="0 18.44 17.78 18.44 26.67 27.33 8.89 27.33 0 18.44" class="nl-mesh"/>
        </svg>
        <span class="back-label">← /demos</span>
      </a>

      <nav>
        <a href="/demos/blog/" data-page="home">Home</a>
        <a href="/demos/blog/posts/" data-page="posts">Posts</a>
        <a href="/demos/blog/about/" data-page="about">About</a>
        <a href="/demos/blog/links/" data-page="links">Links</a>
      </nav>

      <button class="nav-burger" type="button" aria-label="Toggle menu" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true">
          <line x1="3" y1="8" x2="21" y2="8"/>
          <line x1="3" y1="16" x2="21" y2="16"/>
        </svg>
      </button>

      <div class="theme-wrap">
        <label class="theme-mode" title="Toggle theme">
          <input type="checkbox" class="theme-mode-input" id="blog-theme-toggle">
          <span class="theme-mode-track">
            <span class="theme-mode-thumb">
              <svg viewBox="0 0 80 80" class="theme-icon sun" aria-hidden="true">
                <circle cx="40" cy="40" r="28" fill="currentColor"/>
              </svg>
              <svg viewBox="0 0 80 80" class="theme-icon moon" aria-hidden="true">
                <path d="M33.25,12c-3.71,0-7.26.73-10.5,2.04,10.26,4.15,17.5,14.21,17.5,25.96s-7.24,21.8-17.5,25.96c3.24,1.31,6.79,2.04,10.5,2.04,15.46,0,28-12.54,28-28s-12.54-28-28-28Z" fill="currentColor"/>
              </svg>
            </span>
          </span>
        </label>
      </div>
    </div>

    <div class="nav-drawer-backdrop" aria-hidden="true"></div>

    <nav class="nav-drawer" aria-label="Mobile navigation" aria-hidden="true">
      <a href="/demos/blog/" data-page="home">Home</a>
      <a href="/demos/blog/posts/" data-page="posts">Posts</a>
      <a href="/demos/blog/about/" data-page="about">About</a>
      <a href="/demos/blog/links/" data-page="links">Links</a>
    </nav>
    `
  }
}

export default blogTopBar
