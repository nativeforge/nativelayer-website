import {readyElement} from '/__src/components/ready-element.js';
import svgNinja from '/__src/components/svg-ninja.js';

customElements.define('svg-ninja', svgNinja);

export default class baseBackTo extends readyElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  get HTML() {
    return`
    <style>
      .back-to-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: var(--space-unit);
        box-shadow: 0 0 0 1px hsla(0 0% 100% / .4);
        border-radius: calc(var(--space-unit) * 1);
        padding: 0;
        
      }
      .back-to-button {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: var(--space-unit);
      }
      .back-to-button-arrow {
        font-size: var(--f-size-p);
      }
      .back-to-button-logo {
        width: calc(var(--space-unit) * 5);
        height: calc(var(--space-unit) * 5);
      }
      .back-to-button-link {
        text-decoration: none;
        color: inherit;

        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: calc( var(--space-unit) * 2);
        width: 100%; height: 100%;
        padding-inline: calc(var(--space-unit) * 4);
      }

    </style>
    <div class="back-to-container">
      <base-button class="back-to-button">
        <a href="/demos" class="back-to-button-link">
          <span class="back-to-button-arrow">←</span>
          <svg-ninja svg-class="back-to-button-logo" svg-src="/__src/img/native-lines-logo.svg">
          </svg-ninja>
          <p slot="text">Back to Demos</p>
        </a>
      </base-button>
    </div>
    `;
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = this.HTML;
    this._resolveReady();
  }
}