import { adjustedHSL } from '/__src/js/luminance.js';
import { observeThemeModeRoot } from '/__src/js/theme-mode-host.js';

class baseCard extends HTMLElement {
  constructor() {
    super();

    this.linkExternal = false;
    this.isLinked = false;
    this.href = '';
    this.imgSrc = this.getAttribute('img-src') || '';
    this.flexDirection = this.getAttribute('flex-direction') || 'column';
    this.alignItems = this.getAttribute('align-items') || 'flex-start';
    this.bgColorHsl = this.getAttribute('bg-color-hsl') || 'var(--bcolor-hsl)';

    this.attachShadow({ mode: 'open' });
  }

  syncLinkAttrs() {
    const raw = (this.getAttribute('link') ?? '').trim();
    this.isLinked = raw !== '' && raw !== '#';
    this.href = this.isLinked ? raw : '';
    this.linkExternal = this.hasAttribute('link-external');
  }

  static get observedAttributes() {
    return ['link', 'accent-color-hsl'];
  }

  syncAccentAttrs() {
    const raw = this.getAttribute('accent-color-hsl') || '';
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);

    if (parts.length >= 2) {
      this.accentColorHsl      = parts[0];
      this.accentColorHslLight = parts[1];
    } else if (parts.length === 1) {
      this.accentColorHsl      = parts[0];
      this.accentColorHslLight = parts[0].startsWith('var(')
        ? parts[0]
        : adjustedHSL(parts[0], {
          min: 20, max: 45, strength: 1.2, maxShift: 40,
        });
    } else {
      this.accentColorHsl      = 'var(--accent-color-hsl)';
      this.accentColorHslLight = 'var(--accent-color-hsl)';
    }
  }

  get cardInnerHTML() {
    return `
      <figure class="card-image-block">
        <div class="card-image">
        </div>
        <figcaption class="card-image-caption">
          <slot name="caption"></slot>
        </figcaption>
        <div class="card-flag">
          <slot name="flag"></slot>
        </div>
        <slot name="logo">
        </slot>
      </figure>
      <div class="card-info-block">
        <h3 class="card-title fs-3">
          <slot name="title">
            Default card title
          </slot>
        </h3>
        <p class="card-desc">
          <slot name="description">
            Default card description. Attribute is 'data-desc'.<br>
            This paragraph is the default card description paragraph.<br>
            Default card description paragraph. This paragraph is here by default.
          </slot>
        </p>
      </div>`;
  }

  get HTML() {
    const wrapperOpen = this.isLinked
      ? `<a class="card card-container" href="${this.href}"${this.linkExternal ? ' target="_blank" rel="noopener noreferrer"' : ''}>`
      : `<div class="card card-container">`;
    const wrapperClose = this.isLinked ? '</a>' : '</div>';

    return`
    <style>
      :host {
        --card-width: 100%;
        --card-img-height: calc(var(--space-unit) * 24);
        --card-img-width: 100%;
        --card-desc-lines: 2;
        --card-info-padding: calc(var(--space-unit) * 2);
        --card-accent-dark: ${this.accentColorHsl};
        --card-accent-light: ${this.accentColorHslLight};
        --card-accent-color-hsl: var(--card-accent-dark);
        --card-bg-color-hsl: ${this.bgColorHsl};
        --card-border-radius: calc(var(--space-unit) * 1);
        --card-border-width: 3px;
        --card-caption-padding: calc(var(--space-unit) * 1);
        --card-title-font-family: var(--ff-3, monospace);
        --card-flex-row-align: ${this.alignItems};
        --card-image-block-max-w: none;
        --card-image-bg-pos: center;
        --card-image-transition: background-size 0.4s ease-in-out;
        --card-image-hover-size: 100%;

        container-name: base-card;
        container-type: inline-size;
      }
      :host([flex-direction="row"]) {
        --card-flex-row-align: center;
        --card-image-block-max-w: 12rem;
      }
      :host(.--sans-serif-title) {
        --card-title-font-family: var(--ff-2, sans-serif);
      }
      :host(.--top-center) {
        --card-image-bg-pos: top center;
        --card-image-transition: background-size 0.4s ease;
        --card-image-hover-size: 110%;
      }
      :host(.--stretch-info) {
        display: flex;
        height: 100%;
      }
      :host(.--stretch-info) .card-container {
        flex: 1;
      }
      :host(.--stretch-info) .card-info-block {
        flex: 1;
      }
      :host(.--stretch-info) .card-desc {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      :host([theme-mode="light"]) {
        --card-accent-color-hsl: var(--card-accent-light);
      }

      @media (prefers-color-scheme: light) {
        :host(:not([theme-mode="dark"])) {
          --card-accent-color-hsl: var(--card-accent-light);
        }
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      ::slotted([slot="logo"]) {
        z-index: 1;
      }

      :host(.--demo-thumb) ::slotted([slot="logo"]) {
        z-index: 0;
      }

      .card {
        font-family: var(--ff-2, sans-serif);
        color: currentColor;
        min-height: var(--card-img-height);
        background-color: hsl(var(--card-bg-color-hsl));
        box-shadow: 0 0 0 0 hsla(230 100% 0% / 0) inset, 
        0 0 0px 1px hsla(var(--fcolor-hsl) / 0.2);
        transition: box-shadow 0.32s ease, transform 0.32s ease;

      }
      :host([theme-mode="dark"]) .card {
        box-shadow: 0 0 0 0 hsla(230 100% 0% / 0) inset, 
        0 0 0px 1px hsla(230 100% 0% / 0.6);
      }

      .card:hover {
        box-shadow: 0 0 0 0px hsla(var(--fcolor-hsl) / 0.4) inset, 0 8px 16px 0px hsla(var(--fcolor-hsl) / 0.4);
        transform: translateY(-2px);
      }
      :host([theme-mode="dark"]) .card:hover {
        box-shadow: 0 0 0 1px hsla(230 100% 0% / 0.6) inset, 0 4px 12px 0px hsla(230 100% 0% / 0.8);
        transform: translateY(-4px);
      }

      .card-container {
        display: flex;
        flex-direction: ${this.flexDirection};
        align-items: var(--card-flex-row-align);
        height: 100%;
        justify-content: flex-start;
        width: var(--card-width);

        background: hsl(var(--card-bg-color-hsl));
        border-radius: var(--card-border-radius);
        overflow: hidden;
        text-decoration: none;
        cursor: pointer;
      }

      div.card-container {
        cursor: default;
      }

      .card-image-block {
        position: relative;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        height: var(--card-img-height);
        width: 100%;
        max-width: var(--card-image-block-max-w);
        isolation: isolate;
      }

      .card-image {
        position: absolute;
        inset: 0;
        z-index: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, hsla(var(--card-accent-color-hsl) / 0.5) -350%, hsla(var(--card-accent-color-hsl) / 0) 80%), url(${this.imgSrc});
        background-size: 100%;
        background-position: var(--card-image-bg-pos);
        background-repeat: no-repeat;
        border-bottom: var(--card-border-width) hsl(var(--card-accent-color-hsl)) solid;
        background-blend-mode: luminosity;
        transition: var(--card-image-transition);
      }

      .card-image:hover {
        background-size: var(--card-image-hover-size);
      }

      :host(.--demo-thumb) .card-image {
        z-index: 1;
        pointer-events: none;
      }

      :host(.--big)  {
        --card-img-height: calc(var(--space-unit) * 32);
      }

      .card-image-caption {
        display: flex;
        position: absolute;
        z-index: 2;
        right: calc(var(--space-unit) * 1);
        top: calc(var(--space-unit) * 1);
        /* padding: var(--card-caption-padding); */
        font-size: 0.8rem;
        font-style: italic;
        text-align: left;
        background: linear-gradient(90deg, hsla(var(--card-accent-color-hsl) / 0) -50%, hsla(var(--card-accent-color-hsl) / 0.5) 350%);
        border-radius: calc(var(--space-unit) * 1/2);
      }

      :host(:not(:has([slot="caption"]))) .card-image-caption {
        display: none;
      }

      .card-info-block {
        position: relative;
        display: flex;
        width: 100%;
        flex-direction: column;
        align-items: start;
        row-gap: 16px;
        padding: var(--card-info-padding);
        font-weight: 300;
      }

      .card-title {
        overflow: hidden;
        color: hsl(var(--fcolor-hsl));
        display: -webkit-box;
        margin: 0;
        /* -webkit-line-clamp: 2; */
        -webkit-box-orient: vertical;
        font-family: var(--card-title-font-family);
        letter-spacing: 0.001rem;
      }

      .card-desc {
        height: max-content;
        width: 100%;
        overflow: hidden;
        display: -webkit-box;
        /* -webkit-line-clamp: var(--card-desc-lines); */
        -webkit-box-orient: vertical;
        line-height: 1.4;
        color: hsla(var(--fcolor-hsl) / 0.7);
      }

      .card-label {
        position: absolute;
        z-index: 1;
        background-color: hsl(var(--bcolor-hsl));
        width: 40px;
        height: 40px;
        top: 0;
        right: var(--card-info-padding);
        clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 50% 75%, 0% 100%, 0% 0%);
      }
    </style>

    ${wrapperOpen}
    ${this.cardInnerHTML}
    ${wrapperClose}`;
  }

  connectedCallback() {
    this.render();
    this._themeObserver = observeThemeModeRoot(this);
  }

  disconnectedCallback() {
    this._themeObserver?.disconnect();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) {
      this.render();
    }
  }

  render() {
    this.syncLinkAttrs();
    this.syncAccentAttrs();
    this.shadowRoot.innerHTML = this.HTML;
  }
}

export default baseCard