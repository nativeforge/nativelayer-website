import { html } from '/__src/js/html.js';
import { footerTagline, footerColumns } from '/__src/js/footer-data.js';
import { observeThemeModeRoot } from '/__src/js/theme-mode-host.js';

const GITHUB_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`;

const MESH_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 28" aria-hidden="true" class="brand-logo">
  <polygon points="26.67 9.56 8.89 9.56 0 18.44 17.78 18.44 26.67 9.56"/>
  <polygon points="80 9.56 62.22 9.56 53.33 18.44 71.11 18.44 80 9.56"/>
  <polygon points="35.56 18.44 53.33 18.44 62.22 27.33 44.44 27.33 35.56 18.44"/>
  <polygon points="26.67 9.56 44.44 9.56 53.33 18.44 35.56 18.44 26.67 9.56"/>
  <polygon points="17.78 .67 35.56 .67 44.44 9.56 26.67 9.56 17.78 .67"/>
  <polygon points="53.33 .67 71.11 .67 80 9.56 62.22 9.56 53.33 .67"/>
  <polygon points="0 18.44 17.78 18.44 26.67 27.33 8.89 27.33 0 18.44"/>
</svg>`;

class BaseFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = this._HTML;
    this._themeObserver = observeThemeModeRoot(this);
  }

  disconnectedCallback() {
    this._themeObserver?.disconnect();
  }

  _renderLink(link) {
    const attrs = link.external
      ? 'target="_blank" rel="noopener noreferrer"'
      : '';
    const icon = link.icon === 'github' ? GITHUB_ICON : '';
    return `<a class="footer-link" href="${link.href}" ${attrs}>${icon}<span>${link.label}</span></a>`;
  }

  _renderColumns() {
    return footerColumns.map(col => `
      <div class="footer-column">
        <h3 class="footer-column-title">${col.title}</h3>
        <nav class="footer-nav" aria-label="${col.title}">
          ${col.links.map(l => this._renderLink(l)).join('')}
        </nav>
      </div>
    `).join('');
  }

  get _HTML() {
    const year = new Date().getFullYear();

    return html`
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        --footer-accent: var(--accent-color-hsl, var(--fcolor-hsl));
        --footer-pattern-hsl: var(--fcolor-hsl);
        --footer-pattern-opacity: 0.05;
        --footer-glow-hsl: var(--footer-accent);
        --footer-glow-opacity: 0.07;
        --footer-line-hsl: var(--footer-accent);
        --footer-line-opacity: 0.45;
        position: relative;
        display: block;
        width: 100%;
        margin-top: calc(var(--space-unit) * 8);
        color: hsl(var(--fcolor-hsl));
        background: hsl(var(--bcolor-hsl) / 0.92);
        border-top: 1px solid hsl(var(--fcolor-hsl) / 0.08);
        font-family: var(--ff-2, sans-serif);
        overflow: hidden;
      }

      :host([theme-mode="light"]) {
        --footer-pattern-opacity: 0.1;
        --footer-line-hsl: 200 5% 60%;
        --footer-line-opacity: 0.55;
      }

      :host([theme-mode="light"]) .footer-glow {
        background: radial-gradient(
          ellipse 60% 40% at 50% 0%,
          transparent 0%,
          transparent 70%
        );
      }

      @media (prefers-color-scheme: light) {
        :host(:not([theme-mode="dark"])) {
          --footer-pattern-opacity: 0.1;
          --footer-line-hsl: 55 100% 80%;
          --footer-line-opacity: 0.55;
        }

        :host(:not([theme-mode="dark"])) .footer-glow {
          background: radial-gradient(
            ellipse 60% 40% at 50% 0%,
            transparent 0%,
            transparent 70%
          );
        }
      }

      .footer-grid-bg {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(hsl(var(--footer-pattern-hsl) / var(--footer-pattern-opacity)) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--footer-pattern-hsl) / var(--footer-pattern-opacity)) 1px, transparent 1px);
        background-size: calc(var(--space-unit) * 8) calc(var(--space-unit) * 8);
        mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
        pointer-events: none;
      }

      .footer-glow {
        position: absolute;
        inset: 0;
        background: radial-gradient(
          ellipse 60% 40% at 50% 0%,
          hsl(var(--footer-glow-hsl) / var(--footer-glow-opacity)) 0%,
          transparent 70%
        );
        pointer-events: none;
      }

      .footer-accent-line {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(
          to right,
          transparent,
          hsl(var(--footer-line-hsl) / var(--footer-line-opacity)) 30%,
          hsl(var(--footer-line-hsl) / var(--footer-line-opacity)) 70%,
          transparent
        );
        pointer-events: none;
      }

      .footer-inner {
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 75rem;
        margin: 0 auto;
        padding-inline: var(--page-padding-x);
      }

      .footer-main {
        display: grid;
        grid-template-columns: minmax(14rem, 1.4fr) repeat(3, minmax(8rem, 1fr));
        gap: calc(var(--space-unit) * 8);
        padding-block: calc(var(--space-unit) * 10);
      }

      .footer-brand {
        display: flex;
        flex-direction: column;
        gap: calc(var(--space-unit) * 3);
      }

      .brand-link {
        display: inline-flex;
        align-items: center;
        gap: calc(var(--space-unit) * 1);
        text-decoration: none;
        color: hsl(var(--fcolor-hsl));
        width: fit-content;
        transition: opacity 0.24s;
      }

      .brand-link:hover { opacity: 0.85; }

      .brand-logo {
        width: calc(var(--space-unit) * 4);
        height: auto;
        flex-shrink: 0;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.5;
      }

      .brand-name {
        font-family: var(--ff-1, sans-serif);
        font-size: calc(var(--f-size-3) * 0.5);
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      .brand-tagline {
        font-size: var(--f-size-s);
        line-height: 1.65;
        color: hsl(var(--fcolor-hsl) / 0.55);
        max-width: 22rem;
      }

      .footer-column {
        display: flex;
        flex-direction: column;
        gap: calc(var(--space-unit) * 3);
      }

      .footer-column-title {
        font-family: var(--ff-3, monospace);
        font-size: var(--f-size-t);
        font-weight: 500;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: hsl(var(--fcolor-hsl) / 0.4);
      }

      .footer-nav {
        display: flex;
        flex-direction: column;
        gap: calc(var(--space-unit) * 2);
      }

      .footer-link {
        display: inline-flex;
        align-items: center;
        gap: calc(var(--space-unit) * 1.5);
        width: fit-content;
        font-size: var(--f-size-s);
        font-weight: 400;
        text-decoration: none;
        color: hsl(var(--fcolor-hsl) / 0.72);
        transition: color 0.2s;
      }

      .footer-link:hover {
        color: hsl(var(--footer-accent));
      }

      .footer-link svg {
        flex-shrink: 0;
        opacity: 0.7;
      }

      .footer-link:hover svg { opacity: 1; }

      .footer-bottom {
        position: relative;
        z-index: 1;
        width: 100%;
        background-color: hsl(var(--footer-band-bg, var(--darkester)));
        border-top: 1px solid hsl(var(--fcolor-hsl) / 0.08);
      }

      .footer-bottom-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: calc(var(--space-unit) * 2);
        width: 100%;
        max-width: 75rem;
        margin: 0 auto;
        padding-block: calc(var(--space-unit) * 4);
        padding-inline: var(--page-padding-x);
      }

      :host([theme-mode="light"]) {
        --footer-band-bg: var(--darkest);
        --footer-band-fg: hsl(var(--lightest) / 0.55);
      }

      @media (prefers-color-scheme: light) {
        :host(:not([theme-mode="dark"])) {
          --footer-band-bg: var(--darkest);
          --footer-band-fg: hsl(var(--lightest) / 0.55);
        }
      }

      .footer-copy,
      .footer-note {
        font-family: var(--ff-3, monospace);
        font-size: var(--f-size-t);
        letter-spacing: 0.06em;
        color: var(--footer-band-fg, hsl(var(--fcolor-hsl) / 0.35));
      }

      @media (max-width: 52rem) {
        .footer-main {
          grid-template-columns: 1fr 1fr;
        }
        .footer-brand {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 36rem) {
        .footer-main {
          grid-template-columns: 1fr;
          gap: calc(var(--space-unit) * 6);
        }
      }
    </style>

    <div class="footer-grid-bg" aria-hidden="true"></div>
    <div class="footer-glow" aria-hidden="true"></div>
    <div class="footer-accent-line" aria-hidden="true"></div>

    <div class="footer-inner">
      <div class="footer-main">
        <div class="footer-brand">
          <a href="/" class="brand-link">
            ${MESH_LOGO}
            <span class="brand-name">nativelayer.dev</span>
          </a>
          <p class="brand-tagline">${footerTagline}</p>
        </div>
        ${this._renderColumns()}
      </div>
    </div>

    <div class="footer-bottom">
      <div class="footer-bottom-inner">
        <span class="footer-copy">© ${year} nativelayer.dev</span>
        <span class="footer-note">Built with @nativelayer.dev packages</span>
      </div>
    </div>
    `;
  }
}

export default BaseFooter;
