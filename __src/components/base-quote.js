class baseQuote extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
    <style>
      :host {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: calc(var(--space-unit) * 3);
        padding-block: calc(var(--space-unit) * 4);
        border-bottom: 1px dotted hsla(var(--fcolor-hsl) / 0.6); border-top: 1px dotted hsla(var(--fcolor-hsl) / 0.6);
        font-family: var(--ff-2);
        font-weight: 300;
      }
      ::slotted([slot="quote"]) {
        position: relative;
        font-family: var(--ff-2);
        font-weight: 300;
        font-style: italic;
        color: hsla(var(--fcolor-hsl) / 0.4);
      }
      :host([quotes]) ::slotted([slot="quote"])::before {
        content: "\u201C";
      }
      :host([quotes]) ::slotted([slot="quote"])::after {
        content: "\u201D";
      }
      ::slotted([slot="content"]) {
        font-family: var(--ff-2);
        font-weight: regular;
        color: hsla(var(--fcolor-hsl) / 0.4);
      }
    </style>
    <slot name="quote"></slot>
    <slot name="content"></slot>
    `;
    

  }
}

export default baseQuote
