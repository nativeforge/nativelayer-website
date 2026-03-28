class titleSection extends HTMLElement {
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
        width: 100%;
        background-color: hsl(var(--bcolor-hsl));
        text-align: center;
        padding-top: calc(var(--space-unit) * 6);
        padding-bottom: calc(var(--space-unit) * 4);
        font-family: var(--ff-1);
      }
      h1 {
        color: hsl(var(--accent-color-hsl));
        font-size: var(--f-size-1);
        font-weight: 700;
        font-family: var(--ff-1);
        margin: 0;
        padding-block: calc(var(--space-unit) * 2);
      }
      p {
        font-size: var(--f-size-p);
        font-family: var(--ff-2);
        font-weight: 300;
        margin: 0;
      }
    </style>
    <slot name="title"></slot>
    <slot name="description"></slot>
    `;
  }
}

export default titleSection;