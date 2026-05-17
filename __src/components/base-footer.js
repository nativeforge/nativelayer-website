import { html } from "/__src/js/html.js";
import { readyElement } from "/__src/components/ready-element.js";

class BaseFooter extends readyElement {
  constructor() {
    super();
  }

  get HTML() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        border-top: 1px solid hsla(var(--fcolor-hsl) / 0.8);
        font-family: var(--ff-2, sans-serif);
        color: hsl(var(--bcolor-hsl));
        background-color: hsla(var(--fcolor-hsl) / 0.7);
      }
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }
      .footer {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        width: 100%;
        justify-content: space-between;
        padding-block: calc(var(--space-unit) * 4);
        gap: calc(var(--space-unit) * 4);
        padding: var(--page-padding-x);
      }
      .footer :where(a, a:visited) {
        color: inherit;
        text-decoration: none;
      }
      .footer-brand {
        display: flex;
        align-items: center;
        column-gap: var(--space-unit);
        flex-shrink: 0;
      }
      .footer-logo-link {
        display: flex;
        align-items: center;
        column-gap: var(--space-unit);
        color: inherit;
        text-decoration: none;
      }
      .footer-title {
        font-family: var(--ff-1, sans-serif);
        font-size: var(--f-size-h1);
        color: hsla(var(--fcolor-hsl, 0 0% 100%) / 1);
      }
      .footer-columns {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        gap: calc(var(--space-unit) * 4);
        flex: 1;
        min-width: 0;
      }
      .footer-column {
        display: flex;
        flex-direction: column;
        gap: calc(var(--space-unit) * 3);
      }
      .footer-column-title {
        font-size: var(--f-size-p);
        color: hsla(var(--bcolor-hsl) / 0.9);
        padding-bottom: calc(var(--space-unit) * 2);
      }
      .footer-column :where(ul) {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      ::slotted(.footer-column) :where(a) {
        font-family: var(--ff-2, sans-serif);
        text-decoration: none;
        font-size: var(--f-size-p);
        font-weight: 300;
        color: hsla(var(--fcolor-hsl) / 0.8);
        transition: color 0.2s ease;
      }
      .footer-column :where(a:hover) {
        color: hsla(var(--fcolor-hsl) / 1);
      }
    </style>

    <footer class="footer">
      <div class="footer-columns">
        <div class="footer-column">
          <slot name="column-1"></slot>
        </div>
        <div class="footer-column">
          <slot name="column-2"></slot>
        </div>
        <div class="footer-column">
          <slot name="column-3"></slot>
        </div>
      </div>
    </footer>
    `;
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = this.HTML;

    this._resolveReady();
  }
}

export default BaseFooter;
