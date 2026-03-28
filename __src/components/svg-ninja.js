class svgNinja extends HTMLElement {
  static get observedAttributes() {
    return ['svg-src', 'svg-class'];
  }

  constructor() {
    super();
    this._svg = null;
    this._connected = false;
  }

  connectedCallback() {
    this._connected = true;
    this._fetchAndInject();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._connected) return;

    if (name === 'svg-src') {
      this._fetchAndInject();
    } else if (name === 'svg-class' && this._svg) {
      if (oldValue) this._svg.classList.remove(...oldValue.split(/\s+/).filter(Boolean));
      if (newValue) this._svg.classList.add(...newValue.split(/\s+/).filter(Boolean));
    }
  }

  get svgSrc() {
    return this.getAttribute('svg-src') || '';
  }

  get svgClass() {
    return this.getAttribute('svg-class') || '';
  }

  get svgKeepParent() {
    return this.hasAttribute('svg-keep-parent');
  }

  async _fetchAndInject() {
    const src = this.svgSrc;
    if (!src) return;

    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error(`Failed to fetch SVG: ${response.statusText}`);

      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'image/svg+xml');
      const svg = doc.querySelector('svg');

      if (!svg) throw new Error('No <svg> element found in response');

      const svgClass = this.svgClass;
      if (svgClass) {
        svg.classList.add(...svgClass.split(/\s+/).filter(Boolean));
      }

      this._svg = svg;

      if (this.svgKeepParent) {
        this.innerHTML = '';
        this.appendChild(svg);
      } else {
        this.parentNode.replaceChild(svg, this);
      }
    } catch (error) {
      console.error(`[svg-ninja] ${error.message}`);
    }
  }
}

export default svgNinja;
