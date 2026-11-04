import { observeThemeModeRoot } from '/__src/js/theme-mode-host.js';

class pillBase extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'accent', 'href', 'active', 'arrow']
  }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    this._render()
    this._themeObserver = observeThemeModeRoot(this)
  }

  disconnectedCallback() {
    this._themeObserver?.disconnect()
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) this._render()
  }

  // Full CSS color, var(--token), or --token shorthand
  _normalizeAccentColor(accent) {
    const v = accent.trim()
    if (v.startsWith('var(')) return v
    if (v.startsWith('--')) return `var(${v})`
    if (v.startsWith('hsl(') || v.startsWith('oklch(') || v.startsWith('#')) return v
    return v
  }

  _render() {
    const variant = this.getAttribute('variant') || 'neutral'
    const accent  = this.getAttribute('accent')
    const href    = this.getAttribute('href')
    const active  = this.hasAttribute('active')
    const arrow   = this.hasAttribute('arrow')
    const isLink  = href != null && href !== ''
    const tag     = isLink ? 'a' : 'button'

    if (accent) this.style.setProperty('--pill-accent', this._normalizeAccentColor(accent))
    else this.style.removeProperty('--pill-accent')

    const attrs = [
      isLink ? `href="${href}"` : 'type="button"',
      active ? 'aria-pressed="true"' : 'aria-pressed="false"',
    ].join(' ')

    this.shadowRoot.innerHTML = `
    <style>
      :host {
        display: inline-flex;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: calc(var(--space-unit) * 1.5);
        padding: calc(var(--space-unit) * 1) calc(var(--space-unit) * 2.5);
        font-family: var(--ff-3, 'JetBrains Mono', monospace);
        font-size: var(--f-size-t);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        text-decoration: none;
        border-radius: calc(var(--size-unit) * 0.25);
        cursor: pointer;
        border: 1px solid transparent;
        background: transparent;
        color: inherit;
        font: inherit;
        line-height: 1;
        transition: background 0.2s, box-shadow 0.2s, border-color 0.2s, color 0.2s;
      }

      .arrow {
        opacity: 0.7;
      }

      /* neutral — "All", unscoped filters */
      :host([variant="neutral"]) .pill {
        color: var(--blog-fg-dim, hsl(from hsl(var(--fcolor-hsl)) h s l / 0.55));
        border-color: var(--blog-fg-border, hsl(from hsl(var(--fcolor-hsl)) h s l / 0.1));
        background: var(--blog-fg-surface, hsl(from hsl(var(--fcolor-hsl)) h s l / 0.04));
      }

      :host([variant="neutral"]) .pill:hover,
      :host([variant="neutral"][active]) .pill {
        color: var(--blog-color-fg, hsl(from hsl(var(--fcolor-hsl)) h s l / 0.85));
        border-color: hsl(from var(--blog-color-fg, hsl(var(--fcolor-hsl))) h s l / 0.35);
        background: hsl(from var(--blog-color-fg, hsl(var(--fcolor-hsl))) h s l / 0.08);
        box-shadow: 0 0 calc(var(--space-unit) * 2) hsl(from var(--blog-color-fg, hsl(var(--fcolor-hsl))) h s l / 0.08);
      }

      :host([variant="neutral"]:not([active])) .pill {
        color: hsl(from hsl(var(--fcolor-hsl)) h s l / 0.32);
        border-color: hsl(from hsl(var(--fcolor-hsl)) h s l / 0.06);
        background: hsl(from hsl(var(--fcolor-hsl)) h s l / 0.015);
        box-shadow: none;
      }

      /* signal — accent: full color, var(--token), or --token */
      :host([variant="signal"]) .pill {
        color: hsl(from var(--pill-accent) h s l / 0.5);
        border-color: hsl(from var(--pill-accent) h s l / 0.5);
        background: hsl(from var(--pill-accent) h s l / 0.1);
        box-shadow: 0 0 calc(var(--space-unit) * 2) hsl(from var(--pill-accent) h s l / 0.2);
      }
      :host([theme-mode="light"]):host([variant="signal"]) .pill {
        background: white;
      }

      :host([variant="signal"]) .pill:hover,
      :host([variant="signal"][active]) .pill {
        color: hsl(from var(--pill-accent) h s l / 0.8);
        border-color: hsl(from var(--pill-accent) h s l / 0.8);
        background: hsl(from var(--pill-accent) h s l / 0.14);
        box-shadow: 0 0 calc(var(--space-unit) * 4) hsl(from var(--pill-accent) h s l / 0.35);
      }

      :host([variant="signal"]:not([active])) .pill {
        color: hsl(from var(--pill-accent) h s l / 0.42);
        border-color: hsl(from var(--pill-accent) h s l / 0.42);
        background: hsl(from var(--pill-accent) h s l / 0.04);
        box-shadow: none;
      }

      :host([theme-mode="light"]):host([variant="signal"]:not([active])) .pill {
        background: hsl(from var(--pill-accent) h s l / 0.1);
      }

      /* topic — neutral tags */
      :host([variant="topic"]) .pill {
        color: hsl(from var(--blog-color-fg, hsl(var(--fcolor-hsl))) h s l / 0.2);
        border-color: hsl(from var(--blog-color-fg, hsl(var(--fcolor-hsl))) h s l / 0.2);
        background: var(--blog-fg-surface, hsl(from hsl(var(--fcolor-hsl)) h s l / 0.04));
        box-shadow: 0 0 calc(var(--space-unit) * 2) hsl(from var(--blog-color-fg, hsl(var(--fcolor-hsl))) h s l / 0.2);
      }

      :host([variant="topic"]) .pill:hover,
      :host([variant="topic"][active]) .pill {
        color: hsl(from var(--blog-color-fg, hsl(var(--fcolor-hsl))) h s l / 0.85);
        border-color: hsl(from var(--blog-color-fg, hsl(var(--fcolor-hsl))) h s l / 0.85);
        background: hsl(from var(--blog-color-fg, hsl(var(--fcolor-hsl))) h s l / 0.08);
        box-shadow: 0 0 calc(var(--space-unit) * 2) hsl(from var(--blog-color-fg, hsl(var(--fcolor-hsl))) h s l / 0.4);
      }

      :host([theme-mode="light"]):host([variant="topic"][active]) .pill {
        background-color: white;
        box-shadow: none;
      }

      :host([variant="topic"]:not([active])) .pill {
        color: hsl(from var(--blog-color-fg, hsl(var(--fcolor-hsl))) h s l / 0.4);
        border-color: hsl(from var(--blog-color-fg, hsl(var(--fcolor-hsl))) h s l / 0.4);
        background: hsl(from hsl(var(--fcolor-hsl)) h s l / 0.015);
        box-shadow: none;
      }
    </style>
    <${tag} class="pill" part="pill" ${attrs}>
      <slot></slot>
      ${arrow ? '<span class="arrow" aria-hidden="true">→</span>' : ''}
    </${tag}>`
  }
}

export default pillBase
