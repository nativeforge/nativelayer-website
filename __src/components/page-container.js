import { readyElement } from "/__src/components/ready-element.js";

class pageContainer extends readyElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'})
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
    <style>
      :host {
        position: relative;
        top: var(--top-bar-height);
        display: flex;
        flex-direction: column;
        width: 100%;
        min-height: 100vh;
        padding-block: calc(var(--space-unit) * 4);
        padding-inline: var(--page-padding-x);
      }
      :host > * {
        flex: 1;
      }
    </style>
    <slot></slot>`

    this._resolveReady();
  }
}

export default pageContainer;