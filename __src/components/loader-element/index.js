// ── readyElement core ───────────────────────────────────────────────────────
import { autoDefine }           from '/__src/libs/autoDefine/index.js'
import { waitForElementsReady } from '/__src/libs/waitForElementsReady/index.js'
import '/__src/js/register-svg-ninja.js'

// ───────────────────────────────────────────────────────────────────────────
// <loader-element> — minimal progress-bar loading overlay
//
// Usage:
//   <loader-element app="main" path="/__src/components/" brand="My App"></loader-element>
//
// Attributes:
//   app               — CSS selector for the element to reveal        (default: 'body')
//   reveal-attribute  — attribute set on the app target when ready    (default: 'ready')
//   path              — components path passed to autoDefine          (default: '/components/')
//   naming            — naming convention for autoDefine              (default: 'kebab')
//   brand             — brand name shown in the overlay               (default: '@nativelayer.dev')
//   svg-icon-url      — path to SVG file for the brand icon           (default: '/__src/img/native-lines-logo.svg')
//   show-duration     — ms to keep overlay visible after 100%         (default: 800)
//   step-duration     — CSS transition duration (ms) per progress step (default: 800)
//
// Events:
//   loader-done  — fires when all components are ready
//                  detail: { elapsed: number, components: { tag: string }[] }
// ───────────────────────────────────────────────────────────────────────────

/** Internal class used by waitForElementsReady; stripped before the reveal attribute is set. */
const LOADER_INTERNAL_CLASS = 'loader-ready'

class loaderElement extends HTMLElement {
  static get observedAttributes() {
    return ['app', 'path', 'naming', 'brand', 'svg-icon-url', 'reveal-attribute', 'show-duration', 'step-duration']
  }

  async connectedCallback() {
    const appSel       = this.getAttribute('app')              || 'body'
    const path         = this.getAttribute('path')             || '/components/'
    const naming       = this.getAttribute('naming')           || 'kebab'
    const brand        = this.getAttribute('brand')            || '@nativelayer.dev'
    const svgIconURL   = this.getAttribute('svg-icon-url')     || '/__src/img/native-lines-logo.svg'
    const revealAttr   = this.getAttribute('reveal-attribute') || 'ready'
    const showDuration = Number(this.getAttribute('show-duration') ?? 800) || 800
    const stepDuration = Number(this.getAttribute('step-duration')  ?? 800) || 800

    // One microtask so the rest of the document is fully parsed
    await Promise.resolve()

    const appEl = document.querySelector(appSel)
    if (!appEl) {
      console.warn(`[loader-element] Target "${appSel}" not found in the DOM.`)
      return
    }

    const start = performance.now()

    appEl.removeAttribute(revealAttr)
    this.attachShadow({ mode: 'open' })

    // Discover all custom-element tags (containing a hyphen) in the app
    const tags = [...new Set(
      [...appEl.querySelectorAll('*')]
        .map(el => el.tagName.toLowerCase())
        .filter(tag => tag.includes('-'))
    )]

    const total = tags.length
    let readyCount = 0

    this.shadowRoot.innerHTML = buildTemplate({ brand, svgIconURL, stepDuration })

    const fillEl = this.shadowRoot.querySelector('.progress-fill')

    const setProgress = (pct) => {
      fillEl.style.width = `${Math.min(100, Math.max(0, pct))}%`
    }

    // ── Track ready events bubbling from each component ───────────────────
    const onReady = (e) => {
      const tag = e.target.tagName.toLowerCase()
      if (!tags.includes(tag)) return
      readyCount++
      setProgress(total > 0 ? (readyCount / total) * 100 : 100)
    }
    document.body.addEventListener('ready', onReady)

    // ── 1. Auto-import and define all custom elements ─────────────────────
    await autoDefine({ root: appEl, path, naming })

    // ── 2. Wait for every component to call _resolveReady() ──────────────
    await waitForElementsReady(appEl, {
      revealClass:      LOADER_INTERNAL_CLASS,
      observeMutations: false,
    })

    appEl.classList.remove(LOADER_INTERNAL_CLASS)
    setProgress(100)
    appEl.setAttribute(revealAttr, '')

    document.body.removeEventListener('ready', onReady)

    // ── 3. All done ───────────────────────────────────────────────────────
    const elapsed = Math.round(performance.now() - start)

    this.dispatchEvent(new CustomEvent('loader-done', {
      bubbles:  true,
      composed: true,
      detail: {
        elapsed,
        components: tags.map(tag => ({ tag })),
      },
    }))

    // ── 4. Linger, then fade out ──────────────────────────────────────────
    await sleep(showDuration)

    // element removes itself when the transition ends
    this.addEventListener('transitionend', () => this.remove(), { once: true })
    this.classList.add('done')
  }
}

// ── Template ───────────────────────────────────────────────────────────────
function buildTemplate({ brand, svgIconURL, stepDuration }) {
  return `
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: hsla(var(--bcolor-hsl) / 1);
        font-family: var(--ff-2);
        font-weight: 300;
        color: hsla(var(--fcolor-hsl) / 1);
        z-index: 9999;
        transition: opacity 0.64s ease, visibility 0.64s ease;
      }

      :host(.done) {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }

      .inner {
        width: min(320px, 90vw);
        text-align: center;
      }

      /* ── Brand ───────────────────────────────────────────────── */
      .brand {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        margin-bottom: 2rem;
      }

      .brand-icon-svg {
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }

      .brand-icon-svg svg {
        height: 1.5rem;
        width: auto;
      }

      .brand-name {
        font-size: var(--f-size-2);
        font-weight: 700;
        letter-spacing: -0.02rem;
      }

      /* ── Progress bar ─────────────────────────────────────────── */
      .progress-track {
        width: 100%;
        height: 2px;
        background: hsla(var(--fcolor-hsl) / 0.12);
        border-radius: 2px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        width: 0%;
        background: var(--accent-color, var(--ls-green, #18d55d));
        border-radius: 2px;
        transition: width ${stepDuration}ms ease;
      }
    </style>

    <div class="inner">
      <div class="brand">
        <svg-ninja svg-src="${svgIconURL}" svg-keep-parent class="brand-icon-svg"></svg-ninja>
        <span class="brand-name">${brand}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill"></div>
      </div>
    </div>
  `
}

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Export ─────────────────────────────────────────────────────────────────

export default loaderElement
