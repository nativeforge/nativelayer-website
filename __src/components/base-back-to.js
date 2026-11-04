import svgInsert from '/__src/components/svg-insert/index.js'
// customElements.define('svg-insert', svgInsert)

export default class baseBackTo extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  get HTML() {
    return`
    <style>
      :host{ 
        background-color: hsla(var(--fcolor-hsl) / 0.1);
        border-radius: calc(var(--space-unit) * 1);
        box-shadow: 0 0 0 1px hsla(var(--fcolor-hsl) / .8);
        overflow: hidden;
        font-family: var(--ff-3, monospace);
      }
      .back-to-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: var(--space-unit);
        padding: 0;
        
      }
      .back-to-button {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: calc(var(--space-unit) * 0.5);
      }
      .back-to-button-arrow {
        font-size: var(--f-size-p);
      }
      .back-to-button-logo {
        width: calc(var(--space-unit) * 4);
        height: calc(var(--space-unit) * 4);
        color: hsl(var(--fcolor-hsl));
      }
      .back-to-button-link {
        text-decoration: none;
        color: inherit;
        font-size: var(--f-size-p);
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: calc( var(--space-unit) * 2);
        width: 100%; height: 100%;
        padding-inline: calc(var(--space-unit) * 2);
        padding-block: calc(var(--space-unit) * 0);
      }
      .back-to-button-text {
        font-size: var(--f-size-s);
      }

    </style>
    <div class="back-to-container">
      <base-button class="back-to-button">
        <a href="/demos" class="back-to-button-link">
          <span class="back-to-button-arrow">←</span>
          <svg-insert svg-class="back-to-button-logo" src="/__src/img/native-lines-logo.svg" svg-style="color: hsl(var(--fcolor-hsl))">
          </svg-insert>
          <p slot="text" class="back-to-button-text">Back to /demos</p>
        </a>
      </base-button>
    </div>
    `;
  }
  connectedCallback() {
    if (window.self !== window.top) {
      this.style.display = 'none';
      return;
    }
    this.shadowRoot.innerHTML = this.HTML;
  }
}