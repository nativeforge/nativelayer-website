// class flexContainer extends readyElement {
class flexContainer extends HTMLElement {
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
      </style>
        <slot></slot>
      `;

    // this._resolveReady();
  }
}

export default flexContainer;