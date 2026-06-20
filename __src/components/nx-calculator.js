import { restate }  from '/__src/libs/restate/restate.esm.min.js'
import { reflectx } from '/__src/libs/reflectx/reflectx.esm.min.js'

class nxCalculator extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700&display=swap">
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :host {
          --space-unit: 0.5rem;

          --surface: #272c38;
          --surface-2: #828ca8;
          --surface-hover: #c4c1d6;
          --surface-button: hsla(226 17% 34% / 0.6);
          --over-surface-button: hsla(226 19% 55% / 0.7);
          --screen-bg: hsl(225 20% 11%);

          --accent: #00e5cc;
          --accent-light: #33ffdd;
          --accent-lighter: #77ffee;
          --accent-dark: #00ccb3;
          --accent-darker: #008f7f;
          --accent-dim: #11b3a077;
          --accent-dim-dark: #0f786c77;
          --accent-dim-darker: #0a7e7022;
          --accent-glow: #00e5ca55;
          --accent-scanline: rgba(0, 229, 202, 0.08);

          --text: #60ffe9;
          --text-dim: #7f8ba0;
          --white: #fff;

          --danger: #bd1733;
          --danger-text-hover: #ff5c77;
          --danger-glow: rgba(255, 38, 74, 0.519);
          --danger-bg: #320d1a;
          --danger-bg-hover: #730b2f;

          --operator: #db7713;
          --operator-hover: #ff6416;
          --operator-text-hover:#ffc852;
          --operator-dim: #ae370f;
          --operator-border: #db7713;
          --operator-bg-hover: #ff6600;

          --cut: 12px;
          --cut-sm: 8px;
          --gap: 6px;

          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          min-height: 100vh;
          background: inherit;
          color: var(--text);
          font-family: 'Share Tech Mono', monospace;
        }

        :host-context(html[theme-mode="light"]) {
          --danger-bg: hsl(355, 50%, 72%);
        }

        /* ── Panel ── */
        .calc {
          width: 100%;
          max-width: 380px;
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
          position: relative;
          background: var(--surface);
        }
        :host-context(html[theme-mode="light"]) .calc {
          --surface: #afb5c1;
        }

        :host-context(html[theme-mode="light"]) .calc-header .brand {
          color: hsl(225 20% 11%);
        }

        :host-context(html[theme-mode="light"]) .calc-header .model {
          color: hsl(218 13% 42%);
        }

        :host-context(html[theme-mode="light"]) .display {
          background: hsl(225 18% 86%);
          border-top-color: hsla(173 100% 45% / 0.12);
          border-bottom-color: hsla(173 100% 45% / 0.32);
          border-left-color: hsla(173 100% 45% / 0.12);
          border-right-color: hsla(173 100% 45% / 0.22);
          --accent-scanline: rgba(0, 229, 202, 0.05);

        }

        :host-context(html[theme-mode="light"]) .display-operation {
          color: hsl(218 13% 42%);
        }

        :host-context(html[theme-mode="light"]) .display-value {
          color: hsl(225 15% 22%);
          text-shadow: none;
        }

        .calc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0.25rem;
        }
        
        .calc-header .brand {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent);
          opacity: 0.8;
        }

        .calc-header .model {
          font-size: 0.7rem;
          color: var(--text-dim);
          letter-spacing: 0.15em;
        }

        /* ── Display ── */
        .display {
          background: var(--screen-bg);
          padding: 1rem 1.25rem;
          min-height: 100px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: flex-end;
          gap: 0.25rem;
          position: relative;
          overflow: hidden;
          border-top:    4px solid var(--accent-dim-darker);
          border-bottom: 3px solid var(--accent-dim-dark);
          border-left:   4px solid var(--accent-dim-darker);
          border-right:  1px solid var(--accent-dim);
        }

        .display::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg, transparent, transparent 2px,
            var(--accent-scanline) 2px, var(--accent-scanline) 4px
          );
          pointer-events: none;
        }

        .display-operation {
          font-size: 0.85rem;
          color: var(--text-dim);
          min-height: 1.2em;
          word-break: break-all;
        }

        .display-value {
          font-family: 'Orbitron', sans-serif;
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--accent);
          text-shadow: 0 0 20px var(--accent-glow);
          word-break: break-all;
          line-height: 1.1;
        }

        .display-value.--error {
          color: var(--danger);
          font-size: 1.2rem;
          text-shadow: 0 0 20px var(--danger-glow);
        }

        /* ── Buttons grid ── */
        .buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--gap);
        }

        .btn {
          font-family: 'Share Tech Mono', monospace;
          font-size: 1.1rem;
          border: none;
          cursor: pointer;
          padding: 1rem 0;
          color: var(--text);
          background: var(--surface-button);
          clip-path: polygon(
            var(--cut-sm) 0%, 100% 0%,
            100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%,
            0% 100%, 0% var(--cut-sm)
          );
          position: relative;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          transition: all .3s ease;
        }

        .btn::before {
          content: '';
          position: absolute;
          inset: 2px;
          clip-path: inherit;
          z-index: -1;
          transition: all .3s ease;
        }

        .btn:hover::before {
          background: linear-gradient(0deg, transparent -10%, var(--accent-glow) 150%);
        }

        .btn.--op:hover { color: var(--operator-text-hover); }
        .btn.--op:hover::before { background: linear-gradient(0deg, transparent -10%, var(--operator-hover) 150%); }

        :host-context(html[theme-mode="light"]) .btn.--op:hover {
          color: var(--operator);
        }
        :host-context(html[theme-mode="light"]) .btn.--op:hover::before { 
          background: transparent;
        }

        .btn.--clear:hover { color: var(--danger-text-hover); }
        .btn.--clear:hover::before { background: linear-gradient(0deg, transparent -10%, var(--danger-bg-hover) 150%); }

        .btn:active { transform: translateY(1px) scale(0.97); }

        .btn.--num { font-family: 'Orbitron', sans-serif; font-weight: 400; }
        .btn.--num:hover { color: var(--accent); }

        .btn.--fn.--sign { font-size: 1.6rem; }

        .btn.--op { 
          background: var(--operator-dim);
          color: var(--operator);
          font-size: 1.6rem;
          font-weight: 700; 
        }
        :host-context(html[theme-mode="light"]) .btn.--op {
          background: hsl(24, 8%, 81%);
          color: var(--operator);
        }
        .btn.--op.--active {
          background: var(--operator-hover);
          color: var(--operator-text-hover);
        }
        :host-context(html[theme-mode="light"]) .btn.--op.--active {
          background: var(--operator-hover);
          color: var(--operator-text-hover);
        }

        .btn.--fn { color: var(--text-dim); font-size: 1.2rem; }
        .btn.--fn:hover { color: var(--accent); }

        .btn.--clear { color: var(--danger); background: var(--danger-bg); }
        .btn.--clear:hover { color: var(--danger-text-hover); }

        .btn.--eq {
          grid-column: span 2;
          background: var(--accent);
          color: var(--screen-bg);
          font-family: 'Orbitron', sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          padding: 1rem 0;
        }

        .btn.--zero { grid-column: span 2; }
        .btn.--dot  { font-size: 1.6rem; font-weight: 700; }
        .btn.--bksp { font-size: 1.5rem; letter-spacing: 0.05em; }

        :host-context(html[theme-mode="light"]) :is( .btn.--bksp, .btn.--fn, .btn.--sign) {
          color: var(--text);
        }

        /* ── History ── */
        .history-strip {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.25rem 0;
          scrollbar-width: none;
        }
        .history-strip::-webkit-scrollbar { display: none; }

        .history-item {
          font-size: 0.6rem;
          color: var(--text-dim);
          white-space: nowrap;
          padding: 0.2rem 0.5rem;
          background: var(--surface-button);
          border-radius: 4px;
          flex-shrink: 0;
        }

        /* ── Footer ── */
        .calc-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.15rem;
          padding-top: 0.25rem;
        }
      </style>

      <div class="calc">
        <div class="calc-header">
          <span class="brand">nativelayer</span>
          <span class="model">NX-CALC v1.0</span>
        </div>

        <div class="display">
          <div class="display-operation" x-text="operationDisplay"></div>
          <div class="display-value" x-class="(--error, hasError)" x-text="displayFormatted"></div>
        </div>

        <div class="history-strip" x-if="history.length > 0">
          <template x-for="(item, idx) in history">
            <div class="history-item" x-key="idx" x-text="item"></div>
          </template>
        </div>

        <div class="buttons">
          <button class="btn --clear"  @click="clear()">AC</button>
          <button class="btn --fn --sign" @click="toggleSign()">±</button>
          <button class="btn --fn"     @click="percent()">%</button>
          <button class="btn --op" x-class="(--active, operation === '÷')" @click="inputOperator('÷')">÷</button>

          <button class="btn --num"    @click="inputDigit('7')">7</button>
          <button class="btn --num"    @click="inputDigit('8')">8</button>
          <button class="btn --num"    @click="inputDigit('9')">9</button>
          <button class="btn --op" x-class="(--active, operation === '×')" @click="inputOperator('×')">×</button>

          <button class="btn --num"    @click="inputDigit('4')">4</button>
          <button class="btn --num"    @click="inputDigit('5')">5</button>
          <button class="btn --num"    @click="inputDigit('6')">6</button>
          <button class="btn --op" x-class="(--active, isOpSub)" @click="opSub()">−</button>

          <button class="btn --num"    @click="inputDigit('1')">1</button>
          <button class="btn --num"    @click="inputDigit('2')">2</button>
          <button class="btn --num"    @click="inputDigit('3')">3</button>
          <button class="btn --op" x-class="(--active, isOpAdd)" @click="opAdd()">+</button>

          <button class="btn --num --zero" @click="inputDigit('0')">0</button>
          <button class="btn --num --dot"  @click="inputDot()">.</button>
          <button class="btn --fn --bksp"  @click="backspace()">⌫</button>
          <button class="btn --eq" @click="calculate()" style="grid-column: 1 / -1;">=</button>
        </div>

      </div>
    `

    const calc = this.shadowRoot.querySelector('.calc')

    // ── State ────────────────────────────────────────────────────────────────
    const state = restate({
      currentOperand:  '0',
      previousOperand: '',
      operation:       null,
      resetNext:       false,
      hasError:        false,
      history:         [],
    })

    state.$computed({
      displayFormatted(s) {
        if (s.hasError) return 'Error'
        const val = s.currentOperand
        if (val.includes('.')) return val
        const num = parseFloat(val)
        if (isNaN(num)) return val
        if (Math.abs(num) >= 1e15) return num.toExponential(6)
        return num.toLocaleString('en-US')
      },
      operationDisplay(s) {
        if (!s.operation || !s.previousOperand) return ''
        const prev = parseFloat(s.previousOperand)
        const formatted = isNaN(prev) ? s.previousOperand : prev.toLocaleString('en-US')
        return formatted + ' ' + s.operation
      },
      isOpAdd(s) { return s.operation === '+' },
      isOpSub(s) { return s.operation === '-' },
    })

    state.$methods({
      inputDigit(digit) {
        if (this.hasError) this.clear()
        if (this.currentOperand === '0' && digit === '0') return
        if (this.resetNext) {
          this.currentOperand = digit
          this.resetNext = false
        } else {
          this.currentOperand = this.currentOperand === '0' ? digit : this.currentOperand + digit
        }
      },
      inputDot() {
        if (this.hasError) this.clear()
        if (this.resetNext) { this.currentOperand = '0.'; this.resetNext = false; return }
        if (this.currentOperand.includes('.')) return
        this.currentOperand += '.'
      },
      inputOperator(op) {
        if (this.hasError) return
        if (this.operation && !this.resetNext) this.computeResult()
        this.previousOperand = this.currentOperand
        this.operation = op
        this.resetNext = true
      },
      calculate() {
        if (this.hasError || !this.operation) return
        this.computeResult()
        this.operation = null
        this.previousOperand = ''
        this.resetNext = true
      },
      computeResult() {
        const prev = parseFloat(this.previousOperand)
        const curr = parseFloat(this.currentOperand)
        if (isNaN(prev) || isNaN(curr)) return
        let result
        switch (this.operation) {
          case '+': result = prev + curr; break
          case '-': result = prev - curr; break
          case '×': result = prev * curr; break
          case '÷':
            if (curr === 0) { this.hasError = true; return }
            result = prev / curr; break
          default: return
        }
        result = parseFloat(result.toPrecision(12))
        const entry = `${prev} ${this.operation} ${curr} = ${result}`
        const hist = [entry, ...this.history].slice(0, 8)
        this.$set(s => { s.currentOperand = String(result); s.history = hist })
      },
      clear() {
        this.$set(s => {
          s.currentOperand = '0'; s.previousOperand = ''; s.operation = null
          s.resetNext = false; s.hasError = false
        })
      },
      toggleSign() {
        if (this.hasError || this.currentOperand === '0') return
        this.currentOperand = this.currentOperand.startsWith('-')
          ? this.currentOperand.slice(1)
          : '-' + this.currentOperand
      },
      percent() {
        if (this.hasError) return
        const val = parseFloat(this.currentOperand)
        if (isNaN(val)) return
        this.currentOperand = String(parseFloat((val / 100).toPrecision(12)))
      },
      backspace() {
        if (this.hasError) { this.clear(); return }
        if (this.resetNext) return
        this.currentOperand = this.currentOperand.length > 1
          ? this.currentOperand.slice(0, -1)
          : '0'
      },
      opAdd() { this.inputOperator('+') },
      opSub() { this.inputOperator('-') },
    })

    // ── Render ────────────────────────────────────────────────────────────────
    const render = () => reflectx(state, calc)
    state.$onChange(() => render())
    render()

    // ── Keyboard ─────────────────────────────────────────────────────────────
    const onKey = (e) => {
      if (e.key >= '0' && e.key <= '9') state.inputDigit(e.key)
      else if (e.key === '.')            state.inputDot()
      else if (e.key === '+')            state.inputOperator('+')
      else if (e.key === '-')            state.inputOperator('-')
      else if (e.key === '*')            state.inputOperator('×')
      else if (e.key === '/') { e.preventDefault(); state.inputOperator('÷') }
      else if (e.key === 'Enter' || e.key === '=') state.calculate()
      else if (e.key === 'Escape')       state.clear()
      else if (e.key === 'Backspace')    state.backspace()
      else if (e.key === '%')            state.percent()
    }
    document.addEventListener('keydown', onKey)
    this._onKey = onKey
  }

  disconnectedCallback() {
    if (this._onKey) document.removeEventListener('keydown', this._onKey)
  }
}

export default nxCalculator
