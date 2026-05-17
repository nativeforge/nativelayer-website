class baseCard extends HTMLElement {
  constructor() {
    super();

    this.href = this.getAttribute('link') || '#';
    this.linkExternal = this.hasAttribute('link-external') || false;
    this.imgSrc = this.getAttribute('img-src') || '';
    this.accentColorHsl = this.getAttribute('accent-color-hsl') || 'var(--accent-color-hsl)';
    this.flexDirection = this.getAttribute('flex-direction') || 'column';
    this.alignItems = this.getAttribute('align-items') || 'flex-start';
    this.bgColorHsl = this.getAttribute('bg-color-hsl') || 'var(--bcolor-hsl)';

    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['link'];
  }

  get HTML() {
    return`
    <style>
      :host {
        --card-width: 100%;
        --card-img-height: calc(var(--space-unit) * 24);
        --card-img-width: 100%;
        --card-desc-lines: 2;
        --card-info-padding: calc(var(--space-unit) * 2);
        --card-accent-color-hsl: var(--accent-color-hsl, ${this.accentColorHsl});
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

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      ::slotted([slot]) {
        z-index: 1;
      }

      .card {
        font-family: var(--ff-2, sans-serif);
        color: currentColor;
        min-height: var(--card-img-height);
        background-color: hsl(var(--card-bg-color-hsl));
      }

      .card-container {
        display: flex;
        flex-direction: ${this.flexDirection};
        align-items: var(--card-flex-row-align);
        height: 100%;
        justify-content: flex-start;
        width: var(--card-width);
        box-shadow: 0 0 0 1px hsla(var(--fcolor-hsl) / 0.2) inset;
        background: hsl(var(--card-bg-color-hsl));
        border-radius: var(--card-border-radius);
        overflow: hidden;
        text-decoration: none;
        cursor: pointer;
        transition: box-shadow 0.32s ease, transform 0.32s ease;
      }

      .card-container:hover {
        box-shadow: 0 0 0 2px hsla(var(--fcolor-hsl) / 0.75) inset;
        transform: translateY(-2px);
      }

      .card-image-block {
        position: relative;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        height: var(--card-img-height);
        width: 100%;
        max-width: var(--card-image-block-max-w);
      }

      .card-image {
        width: 100%;
        height: var(--card-img-height);
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

      .card-image-caption {
        position: absolute;
        right: calc(var(--space-unit) * 1);
        top: calc(var(--space-unit) * 1);
        padding: var(--card-caption-padding);
        font-size: 0.8rem;
        font-style: italic;
        text-align: left;
        background: linear-gradient(90deg, hsla(var(--card-accent-color-hsl) / 0) -50%, hsla(var(--card-accent-color-hsl) / 0.5) 350%);
        border-radius: calc(var(--space-unit) * 1/2);
      }

      .card-info-block {
        position: relative;
        display: flex;
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
        overflow: hidden;
        display: -webkit-box;
        /* -webkit-line-clamp: var(--card-desc-lines); */
        -webkit-box-orient: vertical;
        line-height: 1.618;
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

    <a class="card card-container" href="${this.href}" ${this.linkExternal ? 'target="_blank"' : ''}>
      <figure class="card-image-block">
        <div class="card-image">
        </div>
        <figcaption class="card-image-caption">
          <slot name="caption">Default text enabled</slot>
        </figcaption>
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
      </div>
    </a>`;
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) {
      this.render();
    }
  }

  render() {
    // const href = this.getAttribute('link') || '#';
    // const imgSrc = this.getAttribute('img-src') || '';
    // const accentColorHsl = this.getAttribute('accent-color-hsl') || 'var(--accent-color-hsl)';
    // const flexDirection = this.getAttribute('flex-direction') || 'column';

    this.shadowRoot.innerHTML = this.HTML;
  }
}

export default baseCard