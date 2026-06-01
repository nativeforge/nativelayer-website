class gridContainer extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    gridContainer._injectGlobalStyles()
  }

  static get observedAttributes() {
    return ['grid-template-columns', 'gap']
  }

  connectedCallback() {
    this._render()
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) this._render()
  }

  _render() {
    const columns = this.getAttribute('grid-template-columns') || 'repeat(auto-fill, minmax(20rem, 1fr))'
    const gap     = this.getAttribute('gap')                   || 'var(--page-padding-x)'

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: grid;
          grid-template-columns: ${columns};
          width: 100%;
          min-height: min-content;
          max-height: max-content;
          gap: ${gap};
          margin: 0 auto;
        }
      </style>
      <slot></slot>
    `
  }

  static _injectGlobalStyles() {
    if (document.getElementById('grid-container-styles')) return
    const style = document.createElement('style')
    style.id = 'grid-container-styles'
    style.textContent = `
      .grid-item {
        display: flex;
        width: 100%;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: hsl(var(--fcolor-hsl));
      }

      .grid-item-logo {
        position: absolute;
        inset: 0;
        margin: auto;
        width: 100%;
        min-width: 4rem;
        max-width: 6rem;
        height: 40%;
        max-height: 6rem;
        fill: hsl(var(--accent-color-hsl));
      }

      .grid-2-columns {
        display: grid;
        grid-template-columns: 14rem 1fr;
        gap: calc(var(--space-unit) * 8);
        width: 100%;
        align-items: flex-start;
        padding-block: calc(var(--space-unit) * 8);
      }

      .--sticky {
        position: sticky;
        top: calc(var(--space-unit) * 4);
      }

      .--align-left {
        align-items: flex-start;
        text-align: left;
      }

      .--dimmed {
        color: hsla(var(--fcolor-hsl) / 0.6);
        font-weight: 300;
        font-family: var(--ff-2);
        line-height: 1.4;
      }
    `
    document.head.appendChild(style)
  }
}

export default gridContainer
