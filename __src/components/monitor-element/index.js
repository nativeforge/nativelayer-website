// ── Reactive libraries (CDN — no build step needed) ────────────────────────
import { restate }        from '/__src/libs/restate/restate.esm.min.js'
import { reflectx, html } from '/__src/libs/reflectx/reflectx.esm.min.js'
import '/__src/js/register-svg-ninja.js'

// ── readyElement core ───────────────────────────────────────────────────────
// Adjust these two paths to match your project's structure:
//   • from this repo  →  keep as-is
//   • from npm        →  '@ynck/ready-element/autoDefine'  (once published)
//   • copied source   →  './vendor/autoDefine.js'
import { autoDefine }           from '/__src/libs/autoDefine/index.js'
import { waitForElementsReady } from '/__src/libs/waitForElementsReady/index.js'

// ───────────────────────────────────────────────────────────────────────────
// <monitor-element> — self-contained loading overlay
//
// Usage:
//   <monitor-element app="#app" path="/components/" brand="My App"></monitor-element>
//
// Attributes:
//   app               — CSS selector for the element to reveal   (default: 'body')
//                       Receives a reveal attribute when loading completes (no inline styles).
//   reveal-attribute  — attribute set on the app target when ready (default: 'ready')
//   path              — components path passed to autoDefine      (default: '/components/')
//   naming            — naming convention for autoDefine          (default: 'kebab')
//   brand             — brand name shown in the overlay           (default: '@nativelayer.dev')
//   icon              — brand icon character                      (default: '◆')
//
// Events:
//   monitor-done  — fires when all components are ready
//                   detail: { elapsed: number, components: ComponentInfo[] }
// ───────────────────────────────────────────────────────────────────────────
/** Internal class used by waitForElementsReady; stripped before the reveal attribute is set. */
const MONITOR_INTERNAL_CLASS = 'monitor-ready'

class monitorElement extends HTMLElement {
  static get observedAttributes() {
    return ['app', 'path', 'naming', 'brand', 'svg-icon-url', 'reveal-attribute', 'show-duration']
  }

  async connectedCallback() {
    const appSel = this.getAttribute('app')    || 'body'
    const path   = this.getAttribute('path')   || '/components/'
    const naming = this.getAttribute('naming') || 'kebab'
    const brand  = this.getAttribute('brand')  || 'nativelayer.dev'
    const svgIconURL = this.getAttribute('svg-icon-url') || '/__src/img/native-lines-logo.svg'
    const revealAttr    = this.getAttribute('reveal-attribute') || 'ready'
    const showDuration  = Number(this.getAttribute('show-duration') ?? 800) || 800

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

    // ── Reactive state ────────────────────────────────────────────────────
    const state = restate({
      footer:     'Initializing…',
      success:    false,
      components: tags.map(tag => ({
        tag,
        label: `<${tag}>`,
        ready: false,
        time:  null,
      })),
    })

    // Render shadow DOM template (brand/svgIconURL are static; list is reactive)
    this.shadowRoot.innerHTML = buildTemplate({ brand, svgIconURL })

    reflectx(state, this.shadowRoot)
    state.$onChange(() => reflectx(state, this.shadowRoot))

    // ── Track ready events bubbling from each component ───────────────────
    const onReady = (e) => {
      const tag = e.target.tagName.toLowerCase()
      if (!state.components.some(c => c.tag === tag)) return
      const ms = Math.round(performance.now() - start)
      state.$set({
        footer: `${tag} ready — ${ms}ms`,
        components: state.components.map(c =>
          c.tag === tag ? { ...c, ready: true, time: ms } : c
        ),
      })
    }
    document.body.addEventListener('ready', onReady)

    // ── 1. Auto-import and define all custom elements ─────────────────────
    state.$set({ footer: 'Loading component modules…' })
    await autoDefine({ root: appEl, path, naming })

    // ── 2. Wait for every component to call _resolveReady() ──────────────
    state.$set({ footer: 'Waiting for components to be ready…' })
    await waitForElementsReady(appEl, {
      revealClass:      MONITOR_INTERNAL_CLASS,
      observeMutations: false,
    })

    appEl.classList.remove(MONITOR_INTERNAL_CLASS)
    appEl.setAttribute(revealAttr, '')

    document.body.removeEventListener('ready', onReady)

    // ── 3. All done ───────────────────────────────────────────────────────
    const elapsed = Math.round(performance.now() - start)
    state.$set({ footer: `All ready in ${elapsed}ms`, success: true })

    this.dispatchEvent(new CustomEvent('monitor-done', {
      bubbles:    true,
      composed:   true,
      detail: {
        elapsed,
        components: state.components.map(({ tag, label, ready, time }) =>
          ({ tag, label, ready, time })
        ),
      },
    }))

    // ── 4. Reveal ─────────────────────────────────────────────────────────
    await sleep(showDuration)

    // Remove from DOM after the fade transition completes
    this.addEventListener('transitionend', () => this.remove(), { once: true })
    this.classList.add('done')
  }
}

// ── Template ───────────────────────────────────────────────────────────────
// `brand` and `icon` are injected once via template-literal interpolation.
// Everything else (component list, footer) is reactive via reflectx directives.
function buildTemplate({ brand, svgIconURL }) {
  return html`
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
        text-align: center;
        width: min(320px, 90vw);
      }

      /* ── Brand ───────────────────────────────────────────────── */
      .brand {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        margin-bottom: 2.5rem;
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

      /* ── Subtitle ────────────────────────────────────────────── */
      .subtitle {
        font-size: 0.75rem;
        color: hsla(var(--fcolor-hsl) / 0.6);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        font-weight: 500;
        margin-bottom: calc(var(--space-unit) * 2);
      }

      /* ── Component list ──────────────────────────────────────── */
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
        background: var(--ls-green, #18d55d);
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.45);
        transform: scale(1.2);
      }

      code {
        font-family: var(--ff-3);
        font-size: var(--f-size-p);
        color: hsla(var(--accent-color-hsl), 1);
        flex: 1;
      }

      .time {
        font-size: 0.72rem;
        color: var(--ls-muted, #64748b);
        min-width: 3.5rem;
        text-align: right;
        font-variant-numeric: tabular-nums;
        transition: color 0.3s;
      }

      .is-ready .time { color: var(--ls-green, #22c55e); }

      /* ── Footer message ──────────────────────────────────────── */
      .footer {
        font-size: 0.8rem;
        color: var(--ls-muted, #64748b);
        min-height: 1.2em;
        transition: color 0.3s;
      }

      .footer.done { color: var(--ls-green, #22c55e); }
    </style>

    <div class="inner">
      <div class="brand">
        <svg-ninja svg-src="${svgIconURL}" svg-keep-parent class="brand-icon-svg"></svg-ninja>
        <span class="brand-name">${brand}</span>
      </div>
      <p class="subtitle">Loading custom elements</p>

      <ul class="list">
        <template x-for="comp of components">
          <li x-key="comp.tag" x-class="(is-ready, comp.ready)">
            <span class="dot"></span>
            <code x-text="comp.label"></code>
            <span class="time" x-text="comp.time ? comp.time + 'ms' : '—'"></span>
          </li>
        </template>
      </ul>

      <p class="footer" x-class="(done, success)" x-text="footer"></p>
    </div>
  `
}

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Export ───────────────────────────────────────────────────────────────

export default monitorElement;
