import { restate }        from '/__src/libs/restate/restate.esm.min.js'
import { reflectx, html } from '/__src/libs/reflectx/reflectx.esm.min.js'

// ─── Color helpers ────────────────────────────────────────────────────────────

const _cvs = document.createElement('canvas')
_cvs.width = _cvs.height = 1
const _ctx = _cvs.getContext('2d')

function colorToHex(value) {
  try {
    _ctx.fillStyle = value
    const normalized = _ctx.fillStyle
    if (normalized.startsWith('#')) return normalized.slice(0, 7).toLowerCase()
    const m = normalized.match(/[\d.]+/g)
    if (m && m.length >= 3) {
      return '#' + m.slice(0, 3).map(n => Math.round(parseFloat(n)).toString(16).padStart(2, '0')).join('')
    }
    return null
  } catch { return null }
}

function looksLikeColor(v) {
  if (!v) return false
  const s = v.trim()
  return /^#[0-9a-f]{3,8}$/i.test(s)
    || /^rgba?\s*\([\d\s.%,/]+\)$/i.test(s)
    || /^hsla?\s*\([\d\s.%,/]+\)$/i.test(s)
    || (
      /^[a-zA-Z]+$/.test(s)
      && typeof CSS !== 'undefined'
      && CSS.supports('color', s)
      && !['inherit', 'initial', 'unset', 'revert', 'currentcolor', 'transparent'].includes(s.toLowerCase())
    )
}

// Detects bare HSL component triplets like "250 5% 90%" or "250 5% 90% / 0.8"
// used as CSS var values that are later wrapped in hsl(var(--name)).
function looksLikeHSLComponents(v) {
  if (!v) return false
  const s = v.trim()
  if (!/^\d+\.?\d*\s+\d+\.?\d*%\s+\d+\.?\d*%/.test(s)) return false
  return typeof CSS !== 'undefined' && CSS.supports('color', 'hsl(' + s + ')')
}

// Converts #rrggbb → "H S% L%" so injected values stay usable in hsl(var(--name))
function hexToHSL(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6;               break
      case b: h = ((r - g) / d + 4) / 6;               break
    }
  }
  return Math.round(h * 360) + ' ' + Math.round(s * 100) + '% ' + Math.round(l * 100) + '%'
}

function buildCSS(vars, rule = ':root') {
  const lines = vars
    .filter(v => v.modified && !v.disabled)
    .map(v => `  ${v.name}: ${v.rawValue};`)
  return lines.length ? `${rule} {\n${lines.join('\n')}\n}` : ''
}

function scanCSSColorVars() {
  const rootNames = new Set()

  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (!(rule instanceof CSSStyleRule)) continue
        const sel = (rule.selectorText || '').trim()
        if (sel !== ':root' && sel !== 'html') continue
        for (const prop of rule.style) {
          if (prop.startsWith('--')) rootNames.add(prop.trim())
        }
      }
    } catch { /* cross-origin sheet */ }
  }

  const makeEntry = (name, raw) => {
    const isColor    = looksLikeColor(raw)
    const isHSLParts = !isColor && looksLikeHSLComponents(raw)
    if (!isColor && !isHSLParts) return null
    const hex = colorToHex(isHSLParts ? 'hsl(' + raw + ')' : raw)
    if (!hex) return null
    return { name, rawValue: raw, hex, modified: false, disabled: false, isHSLParts, source: ':root', original: raw, originalHex: hex }
  }

  const rootCS = getComputedStyle(document.documentElement)
  const out    = []

  for (const name of rootNames) {
    const raw   = rootCS.getPropertyValue(name).trim()
    const entry = makeEntry(name, raw)
    if (!entry) continue
    out.push(entry)
  }

  return out.sort((a, b) => a.name.localeCompare(b.name))
}

// Scan color custom properties defined in an element's shadow DOM :host rules.
function scanTargetVars(el) {
  if (!el || !el.shadowRoot) return []

  const names = new Set()
  for (const sheet of el.shadowRoot.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (!(rule instanceof CSSStyleRule)) continue
        const sel = (rule.selectorText || '').trim()
        if (sel === ':host' || sel.startsWith(':host(') || sel.startsWith(':host-context(')) {
          for (const prop of rule.style) {
            if (prop.startsWith('--')) names.add(prop.trim())
          }
        }
      }
    } catch { /* shadow sheet inaccessible */ }
  }

  const elCS = getComputedStyle(el)
  const out  = []

  for (const name of names) {
    const raw        = elCS.getPropertyValue(name).trim()
    if (!raw) continue
    const isColor    = looksLikeColor(raw)
    const isHSLParts = !isColor && looksLikeHSLComponents(raw)
    if (!isColor && !isHSLParts) continue
    const hex = colorToHex(isHSLParts ? 'hsl(' + raw + ')' : raw)
    if (!hex) continue
    out.push({ name, rawValue: raw, hex, modified: false, disabled: false, isHSLParts, source: ':host', original: raw, originalHex: hex })
  }

  return out.sort((a, b) => a.name.localeCompare(b.name))
}

// ─── Component ────────────────────────────────────────────────────────────────

class reTheme extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._dragCtrl = null
  }

  connectedCallback() {
    // Restore saved position before rendering so the host is placed correctly
    this._restorePosition()

    this.shadowRoot.innerHTML = html`
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :host {
          /* All UI colors derived purely from the site's fcolor/bcolor tokens */
          --bg:     hsl(var(--bcolor-hsl));
          --bg-2:   hsl(var(--fcolor-hsl) / 0.04);
          --bg-3:   hsl(var(--fcolor-hsl) / 0.09);
          --border: hsl(var(--fcolor-hsl) / 0.1);
          --text:   hsl(var(--fcolor-hsl) / 0.85);
          --dim:    hsl(var(--fcolor-hsl) / 0.42);
          --muted:  hsl(var(--fcolor-hsl) / 0.2);
          --hi:     hsl(var(--fcolor-hsl));
          --hi-bg:  hsl(var(--fcolor-hsl) / 0.07);

          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 999999;
          display: block;
          width: 500px;
          max-width: calc(100vw - 2rem);
          font-family: var(--ff-2, sans-serif);
          color: var(--text);
          user-select: none;
          
        }

        .panel {
          width: 100%;
          background: var(--bg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 0 2px 0 hsla(var(--fcolor-hsl) / 0.25);
          border-radius: calc(var(--size-unit)* 1/2);
        }

        /* ── Header (drag handle) ── */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0.9rem 0.65rem;
          border-bottom: 1px solid var(--border);
          cursor: grab;
          flex-shrink: 0;
        }
        .header.--dragging { cursor: grabbing; }
        .header:active { cursor: grabbing; }

        .header-left  { display: flex; align-items: baseline; gap: 0.55rem; pointer-events: none; }
        .header-right { display: flex; align-items: center;   gap: 0.45rem; }

        .brand {
          font-family: var(--ff-1, sans-serif);
          font-size: 0.8rem;
          font-weight: 500;
          font-family: var(--ff-3, monospace);
          color: hsl(var(--fcolor-hsl));
        }
        .var-count {
          font-family: var(--ff-3, monospace);
          font-size: 0.8rem;
          color: var(--dim);
        }
        .target-label {
          font-family: var(--ff-3, monospace);
          font-size: 0.8rem;
          color: hsl(var(--fcolor-hsl));
        }
        .target-label::before { 
          content: '/ ';
          opacity: 0.25;
        }
        .modified-badge {
          font-family: var(--ff-3, monospace);
          font-size: 0.58rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          background: var(--hi-bg);
          color: var(--hi);
          padding: 0.12rem 0.45rem;
          border: 1px solid hsl(var(--fcolor-hsl) / 0.25);
        }

        /* ── Minimize button ── */
        .min-btn {
          font-family: var(--ff-2, sans-serif);
          font-size: 0.52rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          height: 20px;
          padding: 0 0.45rem;
          white-space: nowrap;
          user-select: none;
          pointer-events: all;
          transition: all 0.12s;
        }
        .min-btn:hover  { color: var(--text); border-color: var(--dim); }
        .min-btn:active { transform: translateY(1px); }

        /* ── Collapsible body ── */
        .panel-body {
          overflow: hidden;
          max-height: 520px;
          transition: max-height 0.22s ease;
        }
        .panel.--minimized .panel-body { max-height: 0; }
        .panel.--minimized .header     { border-bottom-color: transparent; }

        /* ── Vars list (subgrid root) ── */
        .vars-list {
          display: grid;
          grid-template-columns: 48px max-content 1fr auto auto auto;
          overflow-y: auto;
          max-height: 400px;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }
        .vars-list::-webkit-scrollbar       { width: 3px; }
        .vars-list::-webkit-scrollbar-thumb { background: var(--border); }

        /* ── Row ── */
        .var-row {
          display: grid;
          grid-column: 1 / -1;
          grid-template-columns: subgrid;
          gap: 0.5rem;
          padding: 0 1rem;
          height: 40px;
          align-items: center;
          border-left: 2px solid transparent;
          border-bottom: 1px solid var(--border);
          transition: border-color 0.12s, background 0.12s;
        }
        .var-row:last-child { border-bottom: none; }
        .var-row:hover { background: var(--bg-2); }

        .var-row.--modified {
          border-left-color: var(--hi);
          background: var(--hi-bg);
        }
        .var-row.--modified:hover { background: hsl(var(--fcolor-hsl) / 0.11); }

        .var-row.--disabled {
          opacity: 0.35;
          border-left-color: var(--muted);
        }
        .var-row.--disabled:hover { opacity: 0.5; }

        /* ── Swatch ── */
        .swatch {
          width: 24px;
          height: 24px;
          border: 1px solid var(--border);
          flex-shrink: 0;
        }

        /* ── Var name ── */
        .var-name {
          font-family: var(--ff-3, monospace);
          font-size: 0.7rem;
          color: var(--text);
          white-space: nowrap;
          letter-spacing: 0.01em;
        }
        .var-row.--disabled .var-name { text-decoration: line-through; color: var(--dim); }

        /* ── Var source label (shown only for non-:root vars) ── */
        .var-name-cell {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.05rem;
        }
        .var-source {
          font-family: var(--ff-3, monospace);
          font-size: 0.52rem;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.02em;
          line-height: 1;
        }
        .var-source:empty { display: none; }

        /* ── Raw value input ── */
        .var-raw {
          font-family: var(--ff-3, monospace);
          font-size: 0.62rem;
          background: transparent;
          color: var(--dim);
          border: 1px solid transparent;
          min-width: 0;
          width: 100%;
          outline: none;
          user-select: text;
          transition: border-color 0.12s, background 0.12s, color 0.12s;
        }
        .var-raw:hover:not(:focus) { border-color: var(--border); }
        .var-raw:focus {
          border-color: var(--hi);
          background: var(--bg-3);
          color: var(--text);
        }

        /* ── Color picker ── */
        .color-picker {
          width: 38px;
          height: 24px;
          padding: 0;
          border: 1px solid var(--border);
          background: none;
          cursor: pointer;
          transition: border-color 0.12s;
        }
        .color-picker:hover { border-color: var(--dim); }
        .color-picker::-webkit-color-swatch-wrapper { padding: 0; }
        .color-picker::-webkit-color-swatch         { border: none; }

        /* ── Row buttons ── */
        .btn-row {
          font-family: var(--ff-2, sans-serif);
          font-size: 0.52rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          height: 22px;
          padding: 0 0.3rem;
          white-space: nowrap;
          user-select: none;
          transition: all 0.12s;
        }
        .btn-row:hover  { color: var(--text); border-color: var(--dim); }
        .btn-row:active { transform: translateY(1px); }

        .btn-reset { width: 28px; font-size: 0.78rem; line-height: 1; }
        .btn-reset:hover { color: var(--hi); border-color: var(--hi); }

        .btn-disable { width: 62px; }
        .btn-disable:hover { color: var(--text); border-color: var(--dim); }

        .var-row.--disabled .btn-disable       { color: var(--muted); border-color: var(--border); }
        .var-row.--disabled .btn-disable:hover { color: var(--hi);    border-color: var(--hi); }

        /* ── Empty state ── */
        .empty {
          padding: 2.5rem 1.1rem;
          text-align: center;
          font-size: 0.72rem;
          color: var(--dim);
          font-family: var(--ff-2, sans-serif);
        }
        .empty small {
          display: block;
          margin-top: 0.4rem;
          font-size: 0.62rem;
          color: var(--muted);
          font-family: var(--ff-3, monospace);
        }

        /* ── Footer ── */
        .footer {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.65rem 1.1rem;
          border-top: 1px solid var(--border);
          background: var(--bg-2);
        }
        .status {
          flex: 1;
          font-family: var(--ff-3, monospace);
          font-size: 0.6rem;
          color: var(--dim);
          letter-spacing: 0.07em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .status.--hi { color: var(--hi); }

        /* ── Action buttons ── */
        .btn-action {
          font-family: var(--ff-1, sans-serif);
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--dim);
          cursor: pointer;
          padding: 0.4rem 0.8rem;
          border-radius: calc(var(--size-unit)* 1/2);
          white-space: nowrap;
          user-select: none;
          transition: all 0.12s;
          -webkit-tap-highlight-color: transparent;
        }
        .btn-action:hover  { color: var(--text); border-color: var(--dim); }
        .btn-action:active { transform: translateY(1px); }

        .btn-copy.--done { border-color: hsl(var(--fcolor-hsl) / 0.4); color: var(--hi); }
      </style>

      <div class="panel" x-class="(--minimized, minimized)">

        <div class="header">
          <div class="header-left">
            <span class="brand">re-theme</span>
            <span class="target-label" x-if="targetLabel " x-text="targetLabel + ' : ' "></span>
            <span class="var-count" x-text="varCountLabel"></span>
          </div>
          <div class="header-right">
            <span class="modified-badge" x-if="hasModified" x-text="modifiedBadge"></span>
            <button class="min-btn" @click="toggleMin()" x-text="minLabel"></button>
          </div>
        </div>

        <div class="panel-body">

          <div class="vars-list" x-if="hasVars">
            <template x-for="(v, idx) of vars">
              <div class="var-row" x-key="v.name" x-class="(--modified, v.modified) (--disabled, v.disabled)">
                <div class="swatch"></div>
                <div class="var-name-cell">
                  <span class="var-name" x-text="v.name"></span>
                  <span class="var-source" x-text="vars[idx].source"></span>
                </div>
                <input type="text" class="var-raw">
                <input type="color" class="color-picker">
                <button class="btn-row btn-reset" @click="resetVar(idx)">↺</button>
                <button class="btn-row btn-disable" @click="toggleDisable(idx)" x-text="disableLabels[idx]"></button>
              </div>
            </template>
          </div>

          <div class="empty" x-if="isEmpty">
            No CSS color variables found
            <small>Use pick-root to include :root vars · target-element to include :host vars</small>
          </div>

          <div class="footer">
            <span class="status" x-text="statusMsg"></span>
            <button class="btn-action" @click="resetAll()" x-if="hasModified">RESET ALL</button>
            <button class="btn-action btn-copy" x-class="(--done, copied)" @click="copyStyle()" x-text="copyLabel"></button>
          </div>
        </div>

      </div>
    `

    const panel  = this.shadowRoot.querySelector('.panel')
    const header = this.shadowRoot.querySelector('.header')

    // ── Input sync (post-render) ───────────────────────────────────────────────
    const syncInputs = () => {
      const active = this.shadowRoot.activeElement
      panel.querySelectorAll('.var-row').forEach((row, idx) => {
        const v = state.vars[idx]
        if (!v) return
        const swatch = row.querySelector('.swatch')
        const picker = row.querySelector('.color-picker')
        const rawInp = row.querySelector('.var-raw')
        if (swatch) swatch.style.backgroundColor = v.hex
        if (picker) picker.value = v.hex
        if (rawInp && active !== rawInp) rawInp.value = v.rawValue
      })
    }

    // ── State ─────────────────────────────────────────────────────────────────
    const savedMin = localStorage.getItem('re-theme-min') === 'true'

    let targetEl = null
    const targetSelector = (this.getAttribute('target-element') || '').trim()
    if (targetSelector) {
      try { targetEl = document.querySelector(targetSelector) } catch (_) {}
    }

    // If target-element is a custom element (tag contains a hyphen), wait for it
    // to be defined by autoDefine and for its `.ready` Promise to resolve before
    // we use it as an injection container.
    if (targetSelector) {
      const tagMatch = targetSelector.trim().match(/^([a-z][a-z0-9]*(?:-[a-z0-9]+)+)/)
      if (tagMatch) {
        customElements.whenDefined(tagMatch[1]).then(async () => {
          try { targetEl = document.querySelector(targetSelector) } catch (_) {}
          if (targetEl?.ready instanceof Promise) {
            await targetEl.ready
            // Re-query after ready in case element re-connected
            try { targetEl = document.querySelector(targetSelector) } catch (_) {}
          }
          // Scan :host color vars from the target element's shadow DOM
          const targetVars = scanTargetVars(targetEl)
          if (targetVars.length > 0) {
            const existingNames = new Set(state.vars.map(v => v.name))
            const newVars = targetVars.filter(v => !existingNames.has(v.name))
            if (newVars.length > 0) {
              state.$set(s => {
                s.vars = [...s.vars, ...newVars].sort((a, b) => a.name.localeCompare(b.name))
              })
            }
          }
        })
      }
    }

    const state = restate({
      vars:      this.hasAttribute('pick-root') ? scanCSSColorVars() : [],
      copied:    false,
      minimized: savedMin,
    })

    state.$computed({
      hasVars(s)      { return s.vars.length > 0 },
      isEmpty(s)      { return s.vars.length === 0 },
      hasModified(s)  { return s.vars.some(v => v.modified) },

      varCountLabel(s) { return s.vars.length + ' vars' },
      modifiedBadge(s) { return s.vars.filter(v => v.modified).length + ' modified' },

      targetLabel()    { return targetSelector || '' },

      disableLabels(s) { return s.vars.map(v => v.disabled ? 'ENABLE' : 'DISABLE') },

      minLabel(s)    { return s.minimized ? 'MAX' : 'MIN' },
      copyLabel(s)   { return s.copied ? 'COPIED ✓' : 'COPY' },

      statusMsg(s) {
        const m = s.vars.filter(v => v.modified && !v.disabled).length
        if (m > 0) return m + ' var' + (m !== 1 ? 's' : '') + ' overriding'
        return s.vars.length + ' var' + (s.vars.length !== 1 ? 's' : '') + ' loaded'
      },
    })

    let copyTimer = null

    // Inject into the target element's shadow root if it has one,
    // into the target element itself if it's a regular element,
    // or fall back to document.head.
    const getInjectContainer = () => {
      if (targetEl) return targetEl.shadowRoot || targetEl
      return document.head
    }
    const getInjectRule = () =>
      (targetEl && targetEl.shadowRoot) ? ':host' : ':root'

    const doInject = () => {
      const css = buildCSS(state.vars, getInjectRule())
      const container = getInjectContainer()
      let el = container.querySelector('#re-theme-inject')
      if (!css) { if (el) el.remove(); return }
      if (!el) {
        el = document.createElement('style')
        el.id = 're-theme-inject'
        container.appendChild(el)
      }
      el.textContent = css
    }

    state.$methods({
      toggleMin() {
        state.minimized = !state.minimized
        localStorage.setItem('re-theme-min', state.minimized)
      },

      resetVar(idx) {
        state.$set(s => {
          const v = s.vars[idx]
          if (!v) return
          s.vars[idx] = { ...v, rawValue: v.original, hex: v.originalHex, modified: false, disabled: false }
        })
        doInject()
      },

      toggleDisable(idx) {
        state.$set(s => {
          const v = s.vars[idx]
          if (!v) return
          s.vars[idx] = { ...v, disabled: !v.disabled }
        })
        doInject()
      },

      copyStyle() {
        const css = buildCSS(state.vars, getInjectRule())
        if (!css) return
        navigator.clipboard.writeText(css).catch(() => {})
        state.copied = true
        clearTimeout(copyTimer)
        copyTimer = setTimeout(() => { state.copied = false }, 2000)
      },

      resetAll() {
        state.$set(s => {
          s.vars = s.vars.map(v => ({ ...v, rawValue: v.original, hex: v.originalHex, modified: false, disabled: false }))
        })
        const container = getInjectContainer()
        const el = container.querySelector('#re-theme-inject')
        if (el) el.remove()
      },
    })

    // ── Input delegation ──────────────────────────────────────────────────────
    panel.addEventListener('input', (e) => {
      const row = e.target.closest('.var-row')
      if (!row) return
      const rows = Array.from(panel.querySelectorAll('.var-row'))
      const idx  = rows.indexOf(row)
      if (idx < 0 || idx >= state.vars.length) return

      if (e.target.classList.contains('color-picker')) {
        const hex = e.target.value
        const v   = state.vars[idx]
        // HSL-component vars must stay as "H S% L%" so they keep working in hsl(var(--name))
        const newRaw = v.isHSLParts ? hexToHSL(hex) : hex
        state.$set(s => {
          s.vars[idx] = { ...s.vars[idx], hex, rawValue: newRaw, modified: true }
        })
        // Directly update the sibling text input for immediate visual feedback
        // (don't wait for the reflectx render cycle)
        const rawInp = row.querySelector('.var-raw')
        const swatch = row.querySelector('.swatch')
        if (rawInp) rawInp.value = newRaw
        if (swatch) swatch.style.backgroundColor = hex
        doInject()
      } else if (e.target.classList.contains('var-raw')) {
        const raw = e.target.value
        let hex = state.vars[idx].hex
        if (looksLikeColor(raw))              hex = colorToHex(raw)                 || hex
        else if (looksLikeHSLComponents(raw)) hex = colorToHex('hsl(' + raw + ')') || hex
        state.$set(s => {
          s.vars[idx] = { ...s.vars[idx], rawValue: raw, hex, modified: true }
        })
        doInject()
      }
    })

    // ── Render ────────────────────────────────────────────────────────────────
    const render = () => { reflectx(state, this.shadowRoot); syncInputs() }
    state.$onChange(render)
    render()

    // ── Drag ──────────────────────────────────────────────────────────────────
    const host = this
    let isDragging = false
    let ox = 0, oy = 0

    const clamp = (val, min, max) => Math.max(min, Math.min(val, max))

    const startDrag = (clientX, clientY) => {
      const rect = host.getBoundingClientRect()
      // Switch from CSS right/top to explicit left/top so we can drive position freely
      host.style.right = 'auto'
      host.style.left  = rect.left + 'px'
      host.style.top   = rect.top  + 'px'
      ox = clientX - rect.left
      oy = clientY - rect.top
      isDragging = true
      header.classList.add('--dragging')
    }

    const moveDrag = (clientX, clientY) => {
      if (!isDragging) return
      host.style.left = clamp(clientX - ox, 0, window.innerWidth  - host.offsetWidth)  + 'px'
      host.style.top  = clamp(clientY - oy, 0, window.innerHeight - header.offsetHeight) + 'px'
    }

    const stopDrag = () => {
      if (!isDragging) return
      isDragging = false
      header.classList.remove('--dragging')
      localStorage.setItem('re-theme-pos', JSON.stringify({
        x: parseFloat(host.style.left),
        y: parseFloat(host.style.top),
      }))
    }

    const ctrl   = new AbortController()
    const signal = ctrl.signal

    header.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('.min-btn')) return
      e.preventDefault()
      startDrag(e.clientX, e.clientY)
    }, { signal })

    document.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY), { signal })
    document.addEventListener('mouseup',   stopDrag, { signal })

    header.addEventListener('touchstart', (e) => {
      if (e.target.closest('.min-btn')) return
      const t = e.touches[0]
      startDrag(t.clientX, t.clientY)
    }, { passive: true, signal })

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return
      const t = e.touches[0]
      moveDrag(t.clientX, t.clientY)
    }, { passive: true, signal })

    document.addEventListener('touchend', stopDrag, { signal })

    this._dragCtrl = ctrl
  }

  // ── Restore saved position ─────────────────────────────────────────────────
  _restorePosition() {
    try {
      const saved = localStorage.getItem('re-theme-pos')
      if (!saved) return
      const { x, y } = JSON.parse(saved)
      if (typeof x === 'number' && typeof y === 'number') {
        this.style.left  = x + 'px'
        this.style.top   = y + 'px'
        this.style.right = 'auto'
      }
    } catch { /* malformed entry */ }
  }

  disconnectedCallback() {
    if (this._dragCtrl) {
      this._dragCtrl.abort()
      this._dragCtrl = null
    }
  }
}

export default reTheme
