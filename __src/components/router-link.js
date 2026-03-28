import { readyElement } from "/__src/components/ready-element.js";

export default class routerLink extends readyElement {
  constructor() {
    super()
    this.handleClick = this.handleClick.bind(this)
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
    <style>
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        text-decoration: none;
        color: inherit;
        cursor: pointer;
        transition: color 0.4s ease;
      }
    </style>
    <slot></slot>
    `;

    this.addEventListener("click", this.handleClick)
    this.updateActiveState()

    this._resolveReady();
  }

  handleClick(event) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) {
      return
    }

    const currentUrl = new URL(window.location.href)
    const targetUrl = new URL(this.getAttribute('href'), window.location.origin)

    const normalizePath = (url) => {
      let path = url.pathname
      if (!path.endsWith("/")) path += "/"
      return path
    }

    const normalizedCurrentPath = normalizePath(currentUrl)
    const normalizedTargetPath = normalizePath(targetUrl)

    if( normalizedCurrentPath === normalizedTargetPath &&
      currentUrl.search === targetUrl.search) { 
      event.preventDefault()
      return
    } 
    else {
      event.preventDefault()

      const revealTarget = document.querySelector('body')
      revealTarget.classList.remove('--ready')

      const onTransitionEnd = (e) => {
        if (e.target === revealTarget) {
          revealTarget.removeEventListener('transitionend', onTransitionEnd)
          window.location.href = targetUrl.href
        }
      }
      revealTarget.addEventListener('transitionend', onTransitionEnd)
    }
  }

  updateActiveState() {
    const currentSegments = window.location.pathname.split("/").filter(Boolean)
    const currentFirstSegment = currentSegments.length > 0 ? `/${currentSegments[0]}/` : "/"

    const linkHref = this.getAttribute('href')
    if (!linkHref) return

    const linkSegments = new URL(linkHref, window.location.origin).pathname.split("/").filter(Boolean)
    const linkFirstSegment = linkSegments.length > 0 ? `/${linkSegments[0]}/` : "/"

    if (currentFirstSegment === linkFirstSegment) {
      this.classList.add("--link-active")
    } else {
      this.classList.remove("--link-active")
    }
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.handleClick)
  }
}
