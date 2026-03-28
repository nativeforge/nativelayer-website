import { readyElement } from "/__src/components/ready-element.js";

class flexContainer extends readyElement {
  constructor() {
    super();
    this.direction = this.getAttribute('direction') || 'column';
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          width: 100%;
          flex-direction: ${this.direction};
        }
        :host > * {
          flex: 1;
        }
      </style>
        <slot></slot>
      `;

    this._resolveReady();
  }
}

export default flexContainer;