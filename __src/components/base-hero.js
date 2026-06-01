class baseHero extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
    <style>
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: calc(var(--space-unit) * 2);
        padding-block: calc(var(--space-unit) * 8);
        :where(h1, h2, h3, h4, h5, h6) {
          font-family: var(--ff-1);
        }
        :where(p, span) {
          font-family: var(--ff-2);
          font-weight: 300;
        }
      }
    </style>
    <slot name="title"></slot>
    <slot name="description"></slot>
    `;
  }
}

export default baseHero