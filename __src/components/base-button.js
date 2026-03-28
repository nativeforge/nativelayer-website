class BaseButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['type', 'name', 'form', 'formaction', 'formmethod', 'formtarget', 'formenctype', 'disabled', 'value'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) {
      this.render();
    }
  }

  render() {
    const attrs = [
      ['type', this.getAttribute('type') || 'button'],
      ['name', this.getAttribute('name')],
      ['form', this.getAttribute('form')],
      ['formaction', this.getAttribute('formaction')],
      ['formmethod', this.getAttribute('formmethod')],
      ['formtarget', this.getAttribute('formtarget')],
      ['formenctype', this.getAttribute('formenctype')],
      ['disabled', this.hasAttribute('disabled') ? '' : null],
      ['value', this.getAttribute('value')],
    ]
      .filter(([, v]) => v != null)
      .map(([k, v]) => (v === '' ? k : `${k}="${v}"`))
      .join(' ');

    this.shadowRoot.innerHTML = `
    <style>
      :host {
        display: inline-flex;
        font-family: var(--ff-2, sans-serif);
      }

      .btn {
        border: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: calc(var(--space-unit, 0.5rem) * 1.5) calc(var(--space-unit, 0.5rem) * 2);
        font: inherit;
        border-radius: var(--base-button-radius, calc(var(--space-unit, 0.5rem) * 0.5));
        cursor: pointer;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      :host(.--light) .btn {
        color: hsl(var(--fcolor-hsl));
        box-shadow: 0 0 0 1px hsla(var(--fcolor-hsl) / 0.6) inset;
        background-color: hsl(var(--bcolor-hsl));
        &:hover {
          box-shadow: 0 0 0 1px hsla(var(--fcolor-hsl) / 0.8) inset;
        }
      }
      :host(.--accent) .btn {
        color: hsl(var(--over-accent-color-hsl));
        box-shadow: 0 0 0 1px hsla(var(--accent-color-hsl) / 0.6) inset;
        background-color: hsl(var(--accent-color-hsl));
      }
      :host(.--dense) .btn {
        color: hsl(var(--bcolor-hsl));
        box-shadow: 0 0 0 1px hsla(var(--fcolor-hsl) / 0.6) inset;
        background-color: hsl(var(--fcolor-hsl));
      }

      .btn:hover:not(:disabled) {
      }

      .btn:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px hsla(var(--accent-color-hsl, var(--fcolor-hsl)) / .6);
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .btn-icon ::slotted(*) {
        width: 1em;
        height: 1em;
      }
      .btn ::slotted(a) {
        color: inherit;
        text-decoration: none;
        display: inline-flex;
        width: 100%;
        height: 100%;
        align-items: center;
        justify-content: center;
        font: inherit;
        cursor: pointer;
      }
    </style>
    <button class="btn" part="button" ${attrs}>
      <span class="btn-icon" part="icon">
        <slot name="icon"></slot>
      </span>
      <slot></slot>
    </button>`;
  }
}

export default BaseButton;
