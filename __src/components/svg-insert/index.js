class svgInsert extends HTMLElement {
  static get observedAttributes() {
    return ['src']
  }

  constructor() {
    super()
    this._svg = null
    this._connected = false
  }

  connectedCallback() {
    this._connected = true
    this._fetchAndInject()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._connected || oldValue === newValue) return
    if (name === 'src') this._fetchAndInject()
  }

  async _fetchAndInject() {
    const src = this.getAttribute('src')
    if (!src) return

    try {
      const response = await fetch(src)
      if (!response.ok) throw new Error(`Failed to fetch SVG: ${response.statusText}`)

      const text = await response.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'image/svg+xml')
      const svg = doc.querySelector('svg')

      if (!svg) throw new Error('No <svg> element found in response')

      // Forward all attributes prefixed with 'svg-' onto the <svg> element,
      // stripping the prefix. e.g. svg-id="foo" → id="foo" on the svg.
      // These are also removed from the wrapper.
      for (const attr of [...this.attributes]) {
        if (attr.name.startsWith('svg-')) {
          const svgAttrName = attr.name.slice(4) // strip 'svg-'
          svg.setAttribute(svgAttrName, attr.value)
          this.removeAttribute(attr.name)
        }
      }

      this._svg = svg

      if (this.hasAttribute('keep-parent')) {
        this.innerHTML = ''
        this.appendChild(svg)
      } else {
        this.parentNode.replaceChild(svg, this)
      }
    } catch (error) {
      console.error(`[svg-insert] ${error.message}`)
    }
  }
}

export default svgInsert