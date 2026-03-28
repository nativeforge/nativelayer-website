export class readyElement extends HTMLElement {
  constructor() {
    super()

    this._readyResolved = false

    this.ready = new Promise(resolve => {
      this._resolveReady = () => {
        if (this._readyResolved) return

        this._readyResolved = true
        resolve()
        this.dispatchEvent(new Event('ready'))
      }
    })

    this.ready.then(() => {
      requestAnimationFrame(() => {
        this.setAttribute('ready', '')
      })
    })

  }

  disconnectedCallback() {
    // const duration = parseFloat(getComputedStyle(this).getPropertyValue('--page-transition-time')) || 0;
    // setTimeout(() => {
    //   this.removeAttribute('ready')
    // }, duration * 1000)
  }
}

export default readyElement;