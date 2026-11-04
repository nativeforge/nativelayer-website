import { observeThemeModeRoot } from '/__src/js/theme-mode-host.js';

class postCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static get observedAttributes() {
    return ['slug', 'title', 'excerpt', 'signal', 'topics', 'date', 'read-time', 'accent']
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) this._render()
  }

  connectedCallback() {
    this._render()
    this._themeObserver = observeThemeModeRoot(this)
  }

  disconnectedCallback() {
    this._themeObserver?.disconnect()
  }

  _formatDate(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  _normalizeAccentColor(accent) {
    const v = accent.trim()
    if (v.startsWith('var(')) return v
    if (v.startsWith('--')) return `var(${v})`
    return v
  }

  _render() {
    const slug     = this.getAttribute('slug') || ''
    const title    = this.getAttribute('title') || 'Untitled'
    const excerpt  = this.getAttribute('excerpt') || ''
    const signal   = this.getAttribute('signal') || ''
    const topicsRaw = this.getAttribute('topics') || ''
    const topicList = topicsRaw.split('|').filter(Boolean)
    const date     = this._formatDate(this.getAttribute('date'))
    const readTime = this.getAttribute('read-time') || '5'
    const accent   = this._normalizeAccentColor(this.getAttribute('accent') || 'var(--blog-accent)')
    const href     = `/demos/blog/post/?slug=${slug}`

    const topicsHtml = topicList.map(t =>
      `<span class="card-topic">${this.escapeHtml(t)}</span>`
    ).join('')

    this.shadowRoot.innerHTML = `
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        --card-accent: ${accent};
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
      }

      a.card {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: calc(var(--space-unit) * 4);
        // background: var(--blog-bg-panel);
        border: 1px solid var(--blog-fg-hairline);
        border-bottom: calc(var(--size-unit) * 0.75) solid var(--card-accent);
        border-radius: calc(var(--size-unit) * 0.5);
        text-decoration: none;
        color: var(--blog-color-fg);
        cursor: pointer;
        overflow: hidden;
        transition: transform 0.32s ease, box-shadow 0.32s ease, border-color 0.32s;
        box-shadow: 0 0 0 0 hsl(from var(--card-accent) h s l / 0);
      }

      a.card::before {
        content: '';
        position: absolute;
        z-index: -1;
        inset: 0;
        background: linear-gradient(
          135deg,
          hsl(from var(--card-accent) h s l / 0.04) 0%,
          transparent 60%
        );
        pointer-events: none;
      }

      :host([theme-mode="light"]) a.card::before {
      background: linear-gradient(
        135deg,
        hsla(from white h s l / 1) 0%,
        transparent 150%
        );
      }

      /* scanline effect */
      a.card::after {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
          to bottom,
          transparent 0px,
          transparent 3px,
          var(--blog-fg-scanline) 3px,
          var(--blog-fg-scanline) 4px
        );
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.32s;
      }

      a.card:hover {
        transform: translateY(calc(var(--size-unit) * -1));
        border-color: hsl(from var(--card-accent) h s l / 0.6);
        border-bottom-color: var(--card-accent);
        box-shadow:
          0 calc(var(--space-unit) * 1) calc(var(--space-unit) * 4) hsl(from var(--card-accent) h s l / 0.12),
          0 0 0 1px hsl(from var(--card-accent) h s l / 0.1);
      }

      a.card:hover::after {
        opacity: 1;
      }

      .card-signal {
        display: inline-flex;
        align-items: center;
        gap: calc(var(--space-unit) * 1);
        font-family: var(--ff-3, 'JetBrains Mono', monospace);
        font-size: var(--f-size-t);
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--card-accent);
        text-shadow: 0 0 calc(var(--space-unit) * 2) hsl(from var(--card-accent) h s l / 0.5);
      }
      :host([theme-mode="light"]) .card-signal {
        color: var(--card-accent);
      }

      .card-signal::before {
        content: '>';
        opacity: 0.5;
      }

      .card-topics {
        display: flex;
        flex-wrap: wrap;
        gap: calc(var(--space-unit) * 1);
        margin-bottom: calc(var(--space-unit) * 3);
      }

      .card-topic {
        display: inline-flex;
        align-items: center;
        padding: calc(var(--space-unit) * 0.5) calc(var(--space-unit) * 1.5);
        font-family: var(--ff-3, 'JetBrains Mono', monospace);
        font-size: var(--f-size-t);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--blog-fg-dim);
        background: var(--blog-fg-surface);
        border: 1px solid var(--blog-fg-border);
        border-radius: calc(var(--size-unit) * 0.2);
      }

      .card-header {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: calc(var(--space-unit) * 2);
        margin-bottom: calc(var(--space-unit) * 1);
      }

      .card-title {
        font-family: var(--ff-1, 'Syncopate', sans-serif);
        font-size: var(--f-size-3);
        font-weight: 700;
        line-height: 1.25;
        letter-spacing: 0.02em;
        color: var(--blog-color-fg);
        margin-bottom: calc(var(--space-unit) * 3);
        flex: 1;
      }

      .card-excerpt {
        font-family: var(--ff-2, 'Inconsolata', monospace);
        font-size: var(--f-size-p);
        line-height: 1.65;
        flex: 1;
        margin-bottom: calc(var(--space-unit) * 4);
      }

      .card-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: calc(var(--space-unit) * 2);
        font-family: var(--ff-3, monospace);
        font-size: var(--f-size-s);
        letter-spacing: 0.08em;
        color: var(--blog-fg-faint);
        border-top: 1px solid hsl(from var(--blog-color-fg) h s l / 0.06);
        padding-top: calc(var(--space-unit) * 3);
      }
      :host([theme-mode="light"]) .card-meta {
        border-top-color: hsl(from var(--blog-color-fg) h s l / 0.2);
      }

      .meta-date {
        font-variant-numeric: tabular-nums;
      }
      :host([theme-mode="light"]) .meta-date {
        color: var(--blog-darkest);
      }

      .meta-read {
        display: flex;
        align-items: center;
        gap: calc(var(--space-unit) * 1);
      }
      :host([theme-mode="light"]) .meta-read {
        color: var(--blog-darkest);
      }
    </style>

    <a class="card" href="${href}">
      <div class="card-header">
        <span class="card-signal">${this.escapeHtml(signal)}</span>
        ${topicList.length ? `<div class="card-topics">${topicsHtml}</div>` : ''}
      </div>
      <h2 class="card-title">${this.escapeHtml(title)}</h2>
      <p class="card-excerpt">${this.escapeHtml(excerpt)}</p>
      <div class="card-meta">
        <span class="meta-date">${date}</span>
        <span class="meta-read">${readTime} min read</span>
      </div>
    </a>
    `
  }
}

export default postCard
