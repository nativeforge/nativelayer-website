import { autoDefine }           from '/__src/libs/autoDefine/index.js'
import { waitForElementsReady } from '/__src/libs/waitForElementsReady/index.js'
import { makeReady }            from '/__src/libs/makeReady/index.js'
import svgInsert from '/__src/components/svg-insert/index.js'
customElements.define('svg-insert', svgInsert)

// ───────────────────────────────────────────────────────────────────────────
// <monitor-loading> — unified loading overlay with optional component monitor
//
// Without `monitor` attribute  →  minimal progress-bar overlay (loader-element)
// With    `monitor` attribute  →  verbose component list with dots  (monitor-make-ready)
//
// Shared attributes:
//   target            — CSS selector for the element to reveal        (default: 'body')
//   reveal-attribute  — attribute set on the target when ready        (default: 'ready')
//   path              — components path passed to autoDefine          (default: '/__src/components/')
//   case-convention   — naming convention for autoDefine              (default: 'kebab')
//   brand             — brand name shown in the overlay               (default: '@nativelayer.dev')
//   svg-icon-url      — path to SVG file for the brand icon
//   show-duration     — ms to keep overlay visible after done         (default: 800 / 0)
//   overlay-fade      — ms for the overlay fade-out transition        (default: 640)
//   monitor           — boolean; enables verbose component-list mode
//
// Additional attribute (progress-bar mode only):
//   step-duration     — CSS transition duration (ms) per progress step (default: 800)
//
// Events:
//   loader-done             — fired in progress-bar mode (no `monitor` attribute)
//   monitor-done — fired in monitor mode (`monitor` attribute present)
//   Both carry: detail: { elapsed: number, components: { tag: string }[] }
// ───────────────────────────────────────────────────────────────────────────

class monitorLoading extends HTMLElement {
  static get observedAttributes() {
    return [
      'target', 'path', 'case-convention', 'brand', 'svg-icon-url',
      'reveal-attribute', 'show-duration', 'step-duration',
      'overlay-fade', 'monitor',
    ]
  }

  async connectedCallback() {
    const isMonitor     = this.hasAttribute('monitor')

    const targetSel      = this.getAttribute('target')           || 'body'
    const path           = this.getAttribute('path')             || '/__src/components/'
    const caseConvention = this.getAttribute('case-convention')  || 'kebab'
    const brand         = this.getAttribute('brand')            || '@nativelayer.dev'
    const svgIconURL    = this.getAttribute('svg-icon-url')     || '/__src/img/native-lines-logo.svg'
    const revealAttr    = this.getAttribute('reveal-attribute') || 'ready'
    const showDuration  = Number(this.getAttribute('show-duration')  ?? (isMonitor ? 0 : 800)) || (isMonitor ? 0 : 800)
    const stepDuration  = Number(this.getAttribute('step-duration')  ?? 800) || 800
    const overlayFadeMs = Number(this.getAttribute('overlay-fade')   ?? 640) || 640

    document.documentElement.style.setProperty('--show-duration-delay', `${showDuration + overlayFadeMs}ms`)

    // One microtask so the rest of the document is fully parsed
    await Promise.resolve()

    const targetElement = document.querySelector(targetSel)
    if (!targetElement) {
      console.warn(`[monitor-loading] target="${targetSel}" not found in the DOM.`)
      return
    }

    const start = performance.now()
    targetElement.removeAttribute(revealAttr)
    this.attachShadow({ mode: 'open' })

    // Snapshot all custom-element tags in the target (exclude self to avoid deadlock)
    const selfTag = this.tagName.toLowerCase()
    const tags = [...new Set(
      [...targetElement.querySelectorAll('*')]
        .map(el => el.tagName.toLowerCase())
        .filter(tag => tag.includes('-') && tag !== selfTag)
    )]

    if (isMonitor) {
      await this._runMonitorMode({ targetElement, tags, start, brand, svgIconURL, revealAttr, showDuration, overlayFadeMs, path, caseConvention })
    } else {
      await this._runLoaderMode({ targetElement, tags, start, brand, svgIconURL, revealAttr, showDuration, stepDuration, overlayFadeMs, path, caseConvention })
    }
  }

  // ── Progress-bar mode (loader-element behaviour) ──────────────────────────

  async _runLoaderMode({ targetElement, tags, start, brand, svgIconURL, revealAttr, showDuration, stepDuration, overlayFadeMs, path, caseConvention }) {
    const total = tags.length
    let readyCount = 0

    this.shadowRoot.innerHTML = buildLoaderTemplate({ brand, svgIconURL, stepDuration, overlayFadeMs })

    const fillEl      = this.shadowRoot.querySelector('.progress-fill')
    const setProgress = (pct) => {
      fillEl.style.width = `${Math.min(100, Math.max(0, pct))}%`
    }

    const onReady = (e) => {
      const tag = e.target.tagName.toLowerCase()
      if (!tags.includes(tag)) return
      readyCount++
      setProgress(total > 0 ? (readyCount / total) * 100 : 100)
    }
    document.body.addEventListener('ready', onReady)

    const origDefine = customElements.define.bind(customElements)
    customElements.define = (tag, Ctor, options) => {
      makeReady(Ctor)
      origDefine(tag, Ctor, options)
    }

    await autoDefine({ root: targetElement, path, caseConvention })
    customElements.define = origDefine

    await waitForElementsReady(targetElement, { observeMutations: false })

    setProgress(100)
    targetElement.setAttribute(revealAttr, '')
    if (targetElement.hasAttribute('style')) targetElement.removeAttribute('style')
    document.body.removeEventListener('ready', onReady)

    const elapsed = Math.round(performance.now() - start)
    this.dispatchEvent(new CustomEvent('loader-done', {
      bubbles: true, composed: true,
      detail: { elapsed, components: tags.map(tag => ({ tag })) },
    }))

    await sleep(showDuration)
    this.addEventListener('transitionend', () => this.remove(), { once: true })
    this.classList.add('done')
  }

  // ── Monitor mode (monitor-make-ready behaviour) ───────────────────────────

  async _runMonitorMode({ targetElement, tags, start, brand, svgIconURL, revealAttr, showDuration, overlayFadeMs, path, caseConvention }) {
    const { restate }        = await import('/__src/libs/restate/restate.esm.min.js')
    const { reflectx, html } = await import('/__src/libs/reflectx/reflectx.esm.min.js')

    const total = tags.length
    let readyCount = 0

    const state = restate({
      footer:     'Initializing…',
      success:    false,
      components: tags.map(tag => ({
        tag,
        label:   `<${tag}>`,
        ready:   false,
        patched: false,
        time:    null,
      })),
    })

    this.shadowRoot.innerHTML = buildMonitorTemplate({ brand, svgIconURL, overlayFadeMs })
    reflectx(state, this.shadowRoot)
    state.$onChange(() => reflectx(state, this.shadowRoot))

    const fillEl = this.shadowRoot.querySelector('.progress-fill')
    const setProgress = (pct) => {
      fillEl.style.width = `${Math.min(100, Math.max(0, pct))}%`
    }

    const onReady = (e) => {
      const tag = e.target.tagName.toLowerCase()
      if (!state.components.some(c => c.tag === tag)) return
      readyCount++
      setProgress(total > 0 ? (readyCount / total) * 100 : 100)
      const ms = Math.round(performance.now() - start)
      state.$set({
        footer:     `${tag} ready — ${ms}ms`,
        components: state.components.map(c =>
          c.tag === tag ? { ...c, ready: true, time: ms } : c
        ),
      })
    }
    document.body.addEventListener('ready', onReady)

    state.$set({ footer: 'Loading and patching component modules…' })

    const origDefine = customElements.define.bind(customElements)
    customElements.define = (tag, Ctor, options) => {
      makeReady(Ctor)
      origDefine(tag, Ctor, options)
      state.$set({
        components: state.components.map(c =>
          c.tag === tag ? { ...c, patched: true } : c
        ),
      })
    }

    await autoDefine({ root: targetElement, path, caseConvention })
    customElements.define = origDefine

    state.$set({ footer: 'Waiting for components to be ready…' })
    await waitForElementsReady(targetElement, { observeMutations: false })

    setProgress(100)
    targetElement.setAttribute(revealAttr, '')
    if (targetElement.hasAttribute('style')) targetElement.removeAttribute('style')
    document.body.removeEventListener('ready', onReady)

    const elapsed = Math.round(performance.now() - start)
    state.$set({ footer: `All ready in ${elapsed}ms`, success: true })

    this.dispatchEvent(new CustomEvent('monitor-done', {
      bubbles: true, composed: true,
      detail: {
        elapsed,
        components: state.components.map(({ tag, label, ready, patched, time }) =>
          ({ tag, label, ready, patched, time })
        ),
      },
    }))

    await sleep(showDuration)
    this.addEventListener('transitionend', () => this.remove(), { once: true })
    this.classList.add('done')
  }
}

// ── Shared host styles ──────────────────────────────────────────────────────

const hostCSS = (overlayFadeMs) => `
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
    transition: opacity ${overlayFadeMs}ms ease, visibility ${overlayFadeMs}ms ease;
  }

  :host(.done) {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }

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
`

// ── Loader template (progress-bar mode) ────────────────────────────────────

function buildLoaderTemplate({ brand, svgIconURL, stepDuration, overlayFadeMs }) {
  return `
    <style>
      ${hostCSS(overlayFadeMs)}

      .inner {
        width: min(320px, 90vw);
        text-align: center;
      }

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
        <svg-insert src="${svgIconURL}" keep-parent class="brand-icon-svg"></svg-insert>
        <span class="brand-name">${brand}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill"></div>
      </div>
    </div>
  `
}

// ── Monitor template (component-list mode) ─────────────────────────────────

function buildMonitorTemplate({ brand, svgIconURL, overlayFadeMs }) {
  return `
    <style>
      ${hostCSS(overlayFadeMs)}

      .inner {
        text-align: center;
        width: min(320px, 90vw);
      }

      .subtitle {
        font-size: 0.75rem;
        color: hsla(var(--fcolor-hsl) / 0.6);
        letter-spacing: 0.05em;
        font-weight: 500;
        margin-bottom: calc(var(--space-unit) * 2);
      }

      .list {
        list-style: none;
        border: 1px solid hsla(var(--fcolor-hsl) / 0.1);
        border-radius: var(--base-radius);
        overflow: hidden;
        margin-bottom: calc(var(--space-unit) * 2);
        text-align: left;
      }

      .list li {
        display: flex;
        align-items: center;
        gap: calc(var(--space-unit) * 1);
        padding: calc(var(--space-unit) * 1) calc(var(--space-unit) * 2);
        border-bottom: 1px solid hsla(var(--fcolor-hsl) / 0.1);
        transition: background 0.4s ease;
      }

      .list li:last-child { border-bottom: none; }
      .list li.is-ready   { background: hsla(var(--accent-color-hsl) / 0.04); }

      .dot {
        width: calc(1rem * 0.5);
        height: calc(1rem * 0.5);
        border-radius: 50%;
        background: hsla(var(--fcolor-hsl) / 0.1);
        flex-shrink: 0;
        transition: background 0.4s ease, transform 0.4s ease, box-shadow 0.4s ease;
      }

      .is-ready .dot {
        background: var(--ls-green, #07be4a);
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.45);
        transform: scale(1.2);
      }

      code {
        font-family: var(--ff-3);
        font-size: var(--f-size-s);
        color: hsla(var(--accent-color-hsl), 1);
        flex: 1;
      }

      .patch-badge {
        font-size: 0.65rem;
        font-family: var(--ff-3);
        color: hsla(var(--fcolor-hsl) / 0.35);
        white-space: nowrap;
      }

      .is-ready .patch-badge { color: hsla(var(--accent-color-hsl) / 0.6); }

      .time {
        font-size: 0.72rem;
        color: var(--ls-muted, #64748b);
        min-width: 3.5rem;
        text-align: right;
        font-variant-numeric: tabular-nums;
        transition: color 0.3s;
      }

      .is-ready .time { color: var(--ls-green, #22c55e); }

      .footer {
        font-size: 0.8rem;
        color: var(--ls-muted, #64748b);
        min-height: 1.2em;
        transition: color 0.3s;
      }

      .footer.done { color: var(--ls-green, #22c55e); }

      .progress-track {
        width: 100%;
        height: 2px;
        background: hsla(var(--fcolor-hsl) / 0.12);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: calc(var(--space-unit) * 3);
      }

      .progress-fill {
        height: 100%;
        width: 0%;
        background: var(--accent-color, var(--ls-green, #18d55d));
        border-radius: 2px;
        transition: width 400ms ease;
      }
    </style>

    <div class="inner">
      <div class="brand">
        <svg-insert src="${svgIconURL}" keep-parent class="brand-icon-svg"></svg-insert>
        <span class="brand-name">${brand}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill"></div>
      </div>
      <p class="subtitle">Loading &amp; patching custom elements</p>

      <ul class="list">
        <template x-for="comp of components">
          <li x-key="comp.tag" x-class="(is-ready, comp.ready)">
            <span class="dot"></span>
            <code x-text="comp.label"></code>
            <span class="patch-badge" x-text="comp.patched ? 'makeReady ✓' : ''"></span>
            <span class="time" x-text="comp.time ? comp.time + 'ms' : '—'"></span>
          </li>
        </template>
      </ul>

      <p class="footer" x-class="(done, success)" x-text="footer"></p>
    </div>
  `
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Export ───────────────────────────────────────────────────────────────────

export default monitorLoading
