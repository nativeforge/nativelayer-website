// class pageContainer extends readyElement {
class pageContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'})
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
    <style>
      :host {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        min-height: 100vh;
        max-width: 75rem;
        margin: 0 auto;
        padding-block: calc(var(--space-unit) * 4);
        padding-inline: var(--page-padding-x);
      }
      :host > * {
        flex: 1;
      }
    </style>
    <slot></slot>`

    // this._resolveReady();
  }
}

export default pageContainer;