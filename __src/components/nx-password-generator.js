import { restate }  from '/__src/libs/restate/restate.esm.min.js'
import { reflectx } from '/__src/libs/reflectx/reflectx.esm.min.js'

class nxPasswordGenerator extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('/__src/css/nx-widget-fonts.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :host {
          --space-unit: 0.5rem;

          --surface: #272c38;
          --surface-2:           #828ca8;
          --surface-hover:       #c4c1d6;
          --surface-button:      hsla(226 17% 34% / 0.6);
          --over-surface-button: hsla(226 19% 55% / 0.7);
          --screen-bg:           hsl(200 25% 9%);

          --surface-emboss-top:    hsla(173 100% 45% / 0.075);
          --surface-emboss-left:   hsla(173 100% 45% / 0.11);
          --surface-emboss-bottom: hsla(173 100% 45% / 0.29);
          --surface-emboss-right:  hsla(173 100% 45% / 0.44);

          --accent:         hsl(173 100% 45%);
          --accent-dark:    hsl(173 100% 34%);
          --accent-darker:  hsla(173 83% 38% / 0.4);
          --accent-glow:    hsla(173 100% 45% / 0.33);
          --accent-scanline: hsla(173 100% 45% / 0.08);

          --white:    #fff;
          --text:     hsl(200 28% 85%);
          --text-dim: hsl(218 13% 64%);

          --over-danger-light: hsl(355 100% 83%);
          --over-danger:       hsl(355 95% 76%);
          --danger:            hsl(355 78% 42%);
          --danger-glow:       hsla(355 100% 57% / 0.52);
          --danger-dark:       hsl(355 83% 25%);
          --danger-darker:     hsl(355 62% 23%);

          --alter-over:   hsl(41 81% 77%);
          --alter:        hsl(30 70% 47%);
          --alter-dark:   hsl(26 70% 43%);
          --alter-darker: hsl(24 70% 37%);

          --cut:    12px;
          --cut-sm: 8px;
          --gap:    8px;

          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          min-height: 100vh;
          background: inherit;
          color: var(--text);
          font-family: var(--nx-font-body, 'Share Tech Mono', monospace);
        }

        /* ── Panel ── */
        .panel {
          width: 100%;
          max-width: 420px;
          clip-path: polygon(
            var(--cut) 0%, calc(100% - var(--cut)) 0%,
            100% var(--cut), 100% calc(100% - var(--cut)),
            calc(100% - var(--cut)) 100%, var(--cut) 100%,
            0% calc(100% - var(--cut)), 0% var(--cut)
          );
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: var(--surface);
        }

        :host([theme-mode="light"]) {
          --text: hsl(200 28% 22%);
          --text-dim: hsl(218 13% 42%);
          --screen-bg: hsl(200 22% 86%);
          --surface-button: hsla(226 17% 45% / 0.35);
          --over-surface-button: hsla(226 19% 60% / 0.45);
          --accent-glow: hsla(173 100% 45% / 0.25);
          --accent-scanline: hsla(173 100% 45% / 0.06);
          --danger: hsl(355, 42%, 40%);
          --alter-darker: hsl(24, 80%, 60%);
        }
        :host([theme-mode="light"]) .length-value {
          color: var(--accent-dark);
        }

        :host([theme-mode="light"]) .panel {
          --surface: #c3c7cf;
        }

        :host([theme-mode="light"]) .panel-header .brand {
          color: hsl(173 85% 28%);
        }

        :host([theme-mode="light"]) .toggle.--active {
          color: var(--white);
        }

        :host([theme-mode="light"]) .btn.--generate {
          color: var(--white);
        }

        .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 0 0.25rem; }
        .panel-header .brand { font-family: var(--nx-font-display, 'Orbitron', sans-serif); font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); opacity: 0.8; }
        .panel-header .model { font-size: 0.7rem; color: var(--text-dim); letter-spacing: 0.15em; }

        /* ── Display ── */
        .display {
          background: var(--screen-bg);
          padding: 1.25rem;
          min-height: 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          position: relative;
          overflow: hidden;
          border-top:    4px solid var(--surface-emboss-top);
          border-bottom: 3px solid var(--surface-emboss-bottom);
          border-left:   4px solid var(--surface-emboss-left);
          border-right:  2px solid var(--surface-emboss-right);
        }

        .display::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, var(--accent-scanline) 2px, var(--accent-scanline) 4px);
          pointer-events: none;
        }

        .display-password {
          font-family: var(--nx-font-body, 'Share Tech Mono', monospace);
          font-size: 1.35rem;
          color: var(--accent);
          text-shadow: 0 0 20px var(--accent-glow);
          word-break: break-all;
          text-align: center;
          line-height: 1.4;
          letter-spacing: 0.08em;
        }

        .display-label { font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.15em; }

        /* ── Controls ── */
        .controls { display: flex; flex-direction: column; gap: 1.6rem; }

        .length-control { display: flex; flex-direction: column; gap: 1rem; }
        .length-header  { display: flex; justify-content: space-between; align-items: center; }
        .length-header label { font-size: 0.8rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; }
        .length-header .length-value { font-family: var(--nx-font-display, 'Orbitron', sans-serif); font-size: 1rem; font-weight: 700; color: var(--accent); }

        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          background: var(--surface-button);
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 1rem; height: 0.8rem;
          background: var(--accent);
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 1rem; height: 0.8rem;
          background: var(--accent);
          border: none; cursor: pointer;
        }

        /* ── Toggles ── */
        .toggles { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--gap); }

        .toggle {
          font-family: var(--nx-font-body, 'Share Tech Mono', monospace);
          font-size: 0.75rem;
          border: none;
          cursor: pointer;
          padding: 0.65rem 0.25rem;
          color: var(--text-dim);
          background: var(--surface-button);
          clip-path: polygon(var(--cut-sm) 0%, 100% 0%, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0% 100%, 0% var(--cut-sm));
          transition: background 0.2s ease, color 0.2s ease;
          letter-spacing: 0.05em;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .toggle:hover { color: var(--text); background: var(--over-surface-button); }
        .toggle.--active { background: var(--accent-dark); color: var(--surface); }
        .toggle.--active:hover { background: var(--accent-darker); }

        /* ── Actions ── */
        .actions { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap); }

        .btn {
          font-family: var(--nx-font-body, 'Share Tech Mono', monospace);
          font-size: 1rem;
          border: none;
          cursor: pointer;
          padding: 0.85rem 0;
          color: var(--text);
          background: var(--surface-button);
          clip-path: polygon(var(--cut-sm) 0%, 100% 0%, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0% 100%, 0% var(--cut-sm));
          transition: background 0.2s ease, color 0.2s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .btn:active { transform: translateY(1px) scale(0.97); }

        .btn.--generate { grid-column: span 2; background: var(--accent-dark); color: var(--screen-bg); font-family: var(--nx-font-display, 'Orbitron', sans-serif); font-size: 1.1rem; font-weight: 700; padding: 1rem 0; letter-spacing: 0.1em; }
        .btn.--generate:hover { background: var(--accent-darker); }
        .btn.--generate:active { background: var(--accent-darker); }

        .btn.--copy { background: var(--alter-darker); color: var(--alter-over); font-weight: 700; letter-spacing: 0.05em; }
        .btn.--copy:hover { background: var(--alter-dark); color: var(--alter-over); }
        .btn.--copy.--copied { background: var(--accent-darker); color: var(--accent); }

        .btn.--clear { background: var(--danger-darker); color: var(--over-danger); font-weight: 700; letter-spacing: 0.05em; }
        .btn.--clear:hover { background: var(--danger-dark); color: var(--over-danger); }

        /* ── Strength ── */
        .strength { display: flex; flex-direction: column; gap: 0.8rem; }
        .strength-header { display: flex; justify-content: space-between; align-items: center; }
        .strength-header label { font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; }
        .strength-header .strength-label { font-family: var(--nx-font-display, 'Orbitron', sans-serif); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; }
        .strength-label.--weak   { color: var(--danger); }
        .strength-label.--fair   { color: var(--alter); }
        .strength-label.--good   { color: var(--accent); }
        .strength-label.--strong { color: var(--accent); }

        .strength-bar  { height: 6px; background: var(--surface-button); overflow: hidden; }
        .strength-fill { height: 100%; transition: width 0.3s ease, background 0.3s ease; }
        .strength-fill.--weak   { background: var(--danger); }
        .strength-fill.--fair   { background: var(--alter); }
        .strength-fill.--good   { background: var(--accent); }
        .strength-fill.--strong { background: var(--accent); }

        /* ── History ── */
        .history-strip { display: flex; gap: 0.5rem; overflow-x: auto; padding: 0.25rem 0; scrollbar-width: none; }
        .history-strip::-webkit-scrollbar { display: none; }
        .history-item { font-size: 0.6rem; color: var(--text-dim); white-space: nowrap; padding: 0.2rem 0.5rem; background: var(--surface-button); border-radius: 4px; flex-shrink: 0; cursor: pointer; transition: color 0.15s ease; }
        .history-item:hover { color: var(--accent); }

        /* ── Footer ── */
        .panel-footer { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; padding-top: 0.25rem; }
        .panel-footer p { 
          font-size: 0.8rem;
          color: var(--text-dim);
          letter-spacing: 0.1em;
        }
        .panel-footer a { 
          color: var(--accent);
          text-decoration: none;
          opacity: 0.5;
        }
      </style>

      <div class="panel">
        <div class="panel-header">
          <span class="brand">nativelayer</span>
          <span class="model">NX-PASS v1.0</span>
        </div>

        <div class="display">
          <div class="display-label" x-text="displayLabel"></div>
          <div class="display-password" x-text="password"></div>
        </div>

        <div class="controls">
          <div class="length-control">
            <div class="length-header">
              <label>Length</label>
              <span class="length-value" x-text="length"></span>
            </div>
            <input type="range" min="4" max="64" class="length-range" x-bind:value="length" @input="setLength()">
          </div>

          <div class="toggles">
            <button class="toggle" x-class="(--active, uppercase)" @click="toggleUpper()">A-Z</button>
            <button class="toggle" x-class="(--active, lowercase)" @click="toggleLower()">a-z</button>
            <button class="toggle" x-class="(--active, numbers)"  @click="toggleNumbers()">0-9</button>
            <button class="toggle" x-class="(--active, symbols)"  @click="toggleSymbols()">!@#</button>
          </div>
        </div>

        <div class="strength">
          <div class="strength-header">
            <label>Strength</label>
            <span class="strength-label"
              x-class="(--weak, strengthLevel === 1), (--fair, strengthLevel === 2), (--good, strengthLevel === 3), (--strong, strengthLevel === 4)"
              x-text="strengthText"></span>
          </div>
          <div class="strength-bar">
            <div class="strength-fill"
              x-class="(--weak, strengthLevel === 1), (--fair, strengthLevel === 2), (--good, strengthLevel === 3), (--strong, strengthLevel === 4)"
              x-bind:style="'width:' + strengthPercent + '%'"></div>
          </div>
        </div>

        <div class="actions">
          <button class="btn --generate" @click="generate()" style="grid-column: 1 / -1;">GENERATE</button>
          <button class="btn --copy" x-class="(--copied, copied)" @click="copyToClipboard()" x-text="copyLabel">COPY</button>
          <button class="btn --clear" @click="clearAll()">CLEAR</button>
        </div>

        <div class="history-strip" x-if="history.length > 0">
          <template x-for="(item, idx) in history">
            <div class="history-item" x-key="idx" x-text="item" @click="copyHistoryItem(idx)"></div>
          </template>
        </div>

        <div class="panel-footer">
          <p>Powered by restate + reflectx</p>
        </div>
      </div>
    `

    const panel      = this.shadowRoot.querySelector('.panel')
    const lengthRange = this.shadowRoot.querySelector('.length-range')

    // ── Helpers ────────────────────────────────────────────────────────────
    const CHARSETS = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers:   '0123456789',
      symbols:   '!@#$%^&*()_+-=[]{}|;:,.<>?',
    }

    function generatePassword(length, sets) {
      let pool = ''
      const required = []
      for (const key of Object.keys(CHARSETS)) {
        if (sets[key]) {
          pool += CHARSETS[key]
          required.push(CHARSETS[key][Math.floor(Math.random() * CHARSETS[key].length)])
        }
      }
      if (!pool) return ''
      const chars = Array.from({ length: length - required.length }, () => pool[Math.floor(Math.random() * pool.length)])
      const all = [...required, ...chars]
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]]
      }
      return all.join('')
    }

    function calcStrength(password, opts) {
      if (!password) return 0
      let score = 0
      const len = password.length
      if (len >= 8)  score++
      if (len >= 16) score++
      if (len >= 24) score++
      const typesOn = [opts.uppercase, opts.lowercase, opts.numbers, opts.symbols].filter(Boolean).length
      if (typesOn >= 2) score++
      if (typesOn >= 3) score++
      if (typesOn === 4) score++
      return Math.min(4, Math.max(1, Math.ceil(score / 1.5)))
    }

    // ── State ────────────────────────────────────────────────────────────────
    const state = restate({
      password:  '',
      length:    20,
      uppercase: true,
      lowercase: true,
      numbers:   true,
      symbols:   false,
      copied:    false,
      history:   [],
    })

    state.$computed({
      displayLabel(s)    { return s.password ? `${s.password.length} characters` : 'press generate' },
      strengthLevel(s)   { return calcStrength(s.password, s) },
      strengthText(s)    { const l = { 1: 'WEAK', 2: 'FAIR', 3: 'GOOD', 4: 'STRONG' }; return s.password ? (l[calcStrength(s.password, s)] || '') : '—' },
      strengthPercent(s) { return s.password ? calcStrength(s.password, s) * 25 : 0 },
      copyLabel(s)       { return s.copied ? 'COPIED ✓' : 'COPY' },
    })

    let copiedTimeout = null

    state.$methods({
      generate() {
        const opts = { uppercase: this.uppercase, lowercase: this.lowercase, numbers: this.numbers, symbols: this.symbols }
        const pw = generatePassword(this.length, opts)
        if (!pw) return
        const hist = this.password ? [this.password, ...this.history].slice(0, 10) : [...this.history]
        this.$set(s => { s.password = pw; s.copied = false; s.history = hist })
      },
      setLength() {
        this.length = parseInt(lengthRange.value, 10)
      },
      toggleUpper() {
        if (this.uppercase && !(this.lowercase || this.numbers || this.symbols)) return
        this.uppercase = !this.uppercase
      },
      toggleLower() {
        if (this.lowercase && !(this.uppercase || this.numbers || this.symbols)) return
        this.lowercase = !this.lowercase
      },
      toggleNumbers() {
        if (this.numbers && !(this.uppercase || this.lowercase || this.symbols)) return
        this.numbers = !this.numbers
      },
      toggleSymbols() {
        if (this.symbols && !(this.uppercase || this.lowercase || this.numbers)) return
        this.symbols = !this.symbols
      },
      async copyToClipboard() {
        if (!this.password) return
        try {
          await navigator.clipboard.writeText(this.password)
          this.copied = true
          clearTimeout(copiedTimeout)
          copiedTimeout = setTimeout(() => { state.copied = false }, 2000)
        } catch { /* blocked */ }
      },
      copyHistoryItem(idx) {
        const pw = this.history[idx]
        if (pw) navigator.clipboard.writeText(pw).catch(() => {})
      },
      clearAll() {
        this.$set(s => { s.password = ''; s.copied = false; s.history = [] })
      },
    })

    // ── Render ────────────────────────────────────────────────────────────────
    const render = () => reflectx(state, panel)
    state.$onChange(() => render())
    render()
  }
}

export default nxPasswordGenerator
