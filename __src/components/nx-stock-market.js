import { restate }           from '/__src/libs/restate/restate.esm.min.js'
import { reflectx }          from '/__src/libs/reflectx/reflectx.esm.min.js'
import { scramblePlugin }    from '/__src/libs/reflectx/plugins/scramble/scramble.esm.min.js'
import { AsyncPlugin }       from '/__src/libs/restate/plugins/async.min.js'
import { PersistencePlugin } from '/__src/libs/restate/plugins/persistence.min.js'

reflectx.use(scramblePlugin({ duration: 600, chars: 'numbers', easing: 'easeOut' }))

class nxStockMarket extends HTMLElement {
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

          /* ── Grey-tone palette (mirrors breaking-news) ── */
          --surface: #272c38;
          --surface-light: #828ca8;
          --surface-button: hsla(226 17% 30% / 0.55);
          --over-surface-button: hsla(226 19% 48% / 0.75);
          --screen-bg: hsl(225 20% 15%);

          --surface-emboss-top: hsla(220 70% 65% / 0.06);
          --surface-emboss-left: hsla(220 70% 65% / 0.09);
          --surface-emboss-bottom: hsla(220 70% 65% / 0.20);
          --surface-emboss-right: hsla(220 70% 65% / 0.30);

          --accent: hsl(220 100% 62%);
          --accent-light: hsl(220 100% 75%);
          --accent-dark: hsl(220 100% 55%);
          --accent-darker: hsla(220 83% 38% / 0.4);
          --accent-glow: hsla(220 100% 60% / 0.37);
          --accent-scanline: hsla(220 100% 60% / 0.05);

          --white: #fff;
          --text: hsl(225 28% 88%);
          --text-dim: hsl(225 15% 62%);

          --positive: hsl(145 70% 45%);
          --positive-dim: hsl(145 50% 30%);
          --positive-glow: hsla(145 70% 45% / 0.3);

          --negative: hsl(355 80% 50%);
          --negative-dim: hsl(355 65% 42%);
          --negative-glow: hsla(355 78% 50% / 0.3);
          --over-screen-main: hsla(225 28% 88% / 0.8);
          --over-screen-prim: hsla(225 28% 88% / 0.8);

          --cut: 12px;
          --cut-sm: 8px;
          --gap: 6px;

          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          min-height: 100vh;
          color: var(--text);
          font-family: var(--nx-font-body, 'Share Tech Mono', monospace);
        }

        :host([theme-mode="light"]) {
          --accent: var(--accent-dark);
          --accent-dark: #7885a1;
          --accent-darker: #4a5e87;
          --accent-light: var(--accent-darker);
          --accent-scanline: hsla(220 100% 60% / 0.2);
          --negative: hsl(19 68% 63%);
          --negative-dim: #c38d69;
          --over-screen-prim: var(--accent-darker);
          --positive: #005f61;
          --positive-dim: #267344;
          --positive-glow: #28e2c399;
          --screen-bg: #b8f1ff;
          --surface: #d3d6df;
          --surface-button: #c2f8ff;
          --surface-emboss-bottom: hsla(220 70% 65% / 0.3);
          --surface-emboss-left: hsla(220 70% 65% / 0.25);
          --surface-emboss-right: hsla(220 70% 65% / 0.3);
          --surface-emboss-top: hsla(220 70% 65% / 0.2);
          --surface-light: #b1c1d3;
          --text: var(--accent-darker);
          --text-dim: var(--accent-darker);
        }

        /* ── Panel ── */
        .panel {
          width: 100%;
          max-width: 520px;
          clip-path: polygon(
            var(--cut) 0%, calc(100% - var(--cut)) 0%,
            100% var(--cut), 100% calc(100% - var(--cut)),
            calc(100% - var(--cut)) 100%, var(--cut) 100%,
            0% calc(100% - var(--cut)), 0% var(--cut)
          );
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          background: var(--surface);
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0.25rem;
        }

        .panel-header .brand {
          font-family: var(--nx-font-display, 'Orbitron', sans-serif);
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent);
          opacity: 0.8;
        }

        .panel-header .model {
          font-size: 0.7rem;
          color: var(--text-dim);
          letter-spacing: 0.15em;
        }

        /* ── Search ── */
        .search-section { position: relative; }

        .search-input {
          width: 100%;
          font-family: var(--nx-font-body, 'Share Tech Mono', monospace);
          font-size: 0.8rem;
          padding: 0.6rem 0.75rem;
          background: var(--scanline);
          border: 1px solid var(--accent);
          color: var(--screen-bg);
          outline: none;
          clip-path: polygon(
            var(--cut-sm) 0%, 100% 0%,
            100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%,
            0% 100%, 0% var(--cut-sm)
          );
          transition: border-color 0.4s ease;
        }

        .search-input::placeholder { color: var(--text-dim); }
        .search-input:focus        { border-color: var(--accent); }

        .search-results {
          position: absolute;
          top: 100%;
          left: 0; right: 0;
          background: var(--surface-light);
          border: 1px solid var(--accent-darker);
          border-top: none;
          z-index: 10;
          max-height: 160px;
          overflow-y: auto;
          display: none;
        }

        .search-results.--visible { display: block; }

        .search-result-item {
          padding: 0.45rem 0.75rem;
          font-size: 0.72rem;
          color: var(--text);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          transition: background 0.15s ease;
        }

        .search-result-item:hover  { background: var(--surface-button); }
        .search-result-item .ticker { color: var(--accent-light); font-weight: 700; }
        .search-result-item .name   { color: var(--text-dim); margin-left: 0.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* ── Favorites strip ── */
        .favorites {
          display: flex;
          gap: 5px;
          overflow-x: auto;
          padding: 0.15rem 0;
          scrollbar-width: none;
        }
        .favorites::-webkit-scrollbar { display: none; }

        .fav-chip {
          flex-shrink: 0;
          padding: 0.4rem 0.6rem;
          font-size: 0.65rem;
          cursor: pointer;
          background: var(--surface-button);
          color: var(--text-dim);
          clip-path: polygon(4px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0% 100%, 0% 4px);
          transition: background 0.2s ease, color 0.2s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          display: flex;
          gap: 0.4rem;
          align-items: center;
          white-space: nowrap;
        }

        .fav-chip:hover { color: var(--text); background: var(--over-surface-button); }

        .fav-chip.--selected { background: var(--accent-dark); color: var(--white); }

        .fav-chip .fav-symbol { font-weight: 700; letter-spacing: 0.05em; }
        .fav-chip .fav-change { font-size: 0.6rem; }
        .fav-chip .fav-change.--up   { color: var(--positive); }
        .fav-chip .fav-change.--down { color: var(--negative); }
        .fav-chip.--selected .fav-change.--up   { color: #7fffb0; }
        .fav-chip.--selected .fav-change.--down { color: #ff8899; }

        /* ── Screen (chart area) ── */
        .screen {
          background: var(--screen-bg);
          min-height: 280px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          border-top:    4px solid var(--surface-emboss-top);
          border-bottom: 4px solid var(--surface-emboss-bottom);
          border-left:   4px solid var(--surface-emboss-left);
          border-right:  4px solid var(--surface-emboss-right);
        }

        .screen::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent, transparent 2px,
            var(--accent-scanline) 2px, var(--accent-scanline) 4px
          );
          pointer-events: none;
          z-index: 1;
        }

        .screen-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 0.75rem;
          border-bottom: 1px solid hsla(220 100% 50% / 0.2);
        }

        .screen-ticker {
          font-family: var(--nx-font-display, 'Orbitron', sans-serif);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--over-screen-prim);
          letter-spacing: 0.15em;
        }

        .screen-price-group { display: flex; align-items: baseline; gap: 0.6rem; }

        .screen-price {
          font-family: var(--nx-font-display, 'Orbitron', sans-serif);
          font-size: 1rem;
          font-weight: 700;
          color: var(--over-screen-prim);
        }

        .screen-change { font-size: 0.7rem; letter-spacing: 0.05em; }
        .screen-change.--up   { color: var(--positive); text-shadow: 0 0 12px var(--positive-glow); }
        .screen-change.--down { color: var(--negative); text-shadow: 0 0 12px var(--negative-glow); }

        /* ── Chart ── */
        .chart-area {
          flex: 1;
          padding: 0.5rem 0.5rem 0.25rem;
          position: relative;
          min-height: 170px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chart-area svg { width: 100%; height: 100%; display: block; }

        .chart-placeholder {
          font-size: 0.75rem;
          color: var(--text-dim);
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .chart-loading {
          font-family: var(--nx-font-display, 'Orbitron', sans-serif);
          font-size: 0.65rem;
          color: var(--accent-light);
          letter-spacing: 0.2em;
          animation: pulse 1.2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }

        /* ── Timeframe buttons ── */
        .timeframes { display: flex; gap: 4px; padding: 0.35rem 0.75rem 0.55rem; }

        .tf-btn {
          font-family: var(--nx-font-body, 'Share Tech Mono', monospace);
          font-size: 0.6rem;
          border: none;
          cursor: pointer;
          padding: 0.3rem 0.55rem;
          color: var(--text-dim);
          background: var(--surface-button);
          clip-path: polygon(3px 0%, 100% 0%, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0% 100%, 0% 3px);
          transition: background 0.15s ease, color 0.15s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .tf-btn:hover    { color: var(--text); background: var(--over-surface-button); }
        .tf-btn.--active { background: var(--accent-dark); color: var(--white); }

        /* ── Info row ── */
        .info-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--gap);
          padding: 0 0.15rem;
        }

        .info-cell {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          padding: 0.45rem 0.55rem;
          background: var(--surface-button);
          clip-path: polygon(4px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0% 100%, 0% 4px);
        }

        .info-label {
          font-size: 0.55rem;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .info-value {
          font-family: var(--nx-font-display, 'Orbitron', sans-serif);
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text);
        }

        /* ── Actions ── */
        .actions { display: flex; gap: var(--gap); }

        .btn {
          font-family: var(--nx-font-body, 'Share Tech Mono', monospace);
          font-size: 0.8rem;
          border: none;
          cursor: pointer;
          padding: 0.65rem 0;
          color: var(--text);
          background: var(--surface-button);
          clip-path: polygon(
            var(--cut-sm) 0%, 100% 0%,
            100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%,
            0% 100%, 0% var(--cut-sm)
          );
          transition: background 0.2s ease, color 0.2s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          flex: 1;
          text-align: center;
        }

        .btn:active { transform: translateY(1px) scale(0.97); }

        .btn.--add    { background: var(--accent-dark); color: var(--white); font-weight: 700; letter-spacing: 0.08em; }
        .btn.--add:hover { background: var(--accent); }

        .btn.--remove { background: var(--negative-dim); color: hsl(355 100% 92%); font-weight: 700; letter-spacing: 0.08em; }
        .btn.--remove:hover { background: var(--negative); color: var(--white); }

        .btn.--refresh { font-weight: 700; letter-spacing: 0.08em; }
        .btn.--refresh:hover { background: var(--over-surface-button); }

        .error-msg {
          font-size: 0.7rem;
          color: var(--negative);
          letter-spacing: 0.1em;
          text-align: center;
          padding: 0.5rem;
        }
      </style>

      <div class="panel">
        <div class="panel-header">
          <span class="brand">nativeforge</span>
          <span class="model">NX-STOCK-MARKET v1.0</span>
        </div>

        <div class="search-section">
          <input class="search-input" type="text" placeholder="Search ticker or name..." autocomplete="off">
          <div class="search-results" x-class="(--visible, searchVisible)">
            <template x-for="(res, idx) in searchItems">
              <div class="search-result-item" x-key="idx" @mousedown="pickSearch(idx)">
                <span>
                  <span class="ticker" x-text="res.symbol"></span>
                  <span class="name"   x-text="res.name"></span>
                </span>
                <span style="color:var(--text-dim);font-size:0.6rem" x-text="res.typeLabel"></span>
              </div>
            </template>
          </div>
        </div>

        <div class="favorites">
          <template x-for="(fav, idx) in favData">
            <div class="fav-chip" x-key="fav.fullSym" x-class="(--selected, fav.isSelected)" @click="selectFav(idx)">
              <span class="fav-symbol" x-text="fav.sym"></span>
              <span class="fav-change" x-if="fav.hasChange" x-class="(--up, fav.isUp), (--down, fav.isDown)" x-text="fav.change"></span>
            </div>
          </template>
        </div>

        <div class="screen">
          <div class="screen-header">
            <span class="screen-ticker" x-text.scramble="scramble(tickerLabel, 500, 'upperCase', 'easeOut')"></span>
            <div class="screen-price-group">
              <span class="screen-price"  x-text.scramble="scramble(priceLabel,  700, 'numbers', 'easeOut')"></span>
              <span class="screen-change" x-class="(--up, changeUp), (--down, changeDown)" x-text.scramble="scramble(changeLabel, 600, 'numbers', 'easeOut')"></span>
            </div>
          </div>
          <div class="chart-area"></div>
          <div class="timeframes">
            <button class="tf-btn" x-class="(--active, isRange1d)"  @click="pickRange('1d')">1D</button>
            <button class="tf-btn" x-class="(--active, isRange5d)"  @click="pickRange('5d')">5D</button>
            <button class="tf-btn" x-class="(--active, isRange1mo)" @click="pickRange('1mo')">1M</button>
            <button class="tf-btn" x-class="(--active, isRange3mo)" @click="pickRange('3mo')">3M</button>
            <button class="tf-btn" x-class="(--active, isRange1y)"  @click="pickRange('1y')">1Y</button>
          </div>
        </div>

        <div class="info-row">
          <div class="info-cell">
            <span class="info-label">Open</span>
            <span class="info-value" x-text.scramble="scramble(openVal, 600, 'numbers', 'easeOut')"></span>
          </div>
          <div class="info-cell">
            <span class="info-label">High</span>
            <span class="info-value" x-text.scramble="scramble(highVal, 600, 'numbers', 'easeOut')"></span>
          </div>
          <div class="info-cell">
            <span class="info-label">Low</span>
            <span class="info-value" x-text.scramble="scramble(lowVal, 600, 'numbers', 'easeOut')"></span>
          </div>
          <div class="info-cell">
            <span class="info-label">Vol</span>
            <span class="info-value" x-text.scramble="scramble(volVal, 600, 'numbers', 'easeOut')"></span>
          </div>
        </div>

        <div class="actions">
          <button class="btn --add"     @click="addFav()">ADD</button>
          <button class="btn --remove"  @click="removeFav()">REMOVE</button>
          <button class="btn --refresh" @click="refresh()">REFRESH</button>
        </div>

      </div>
    `

    const panel       = this.shadowRoot.querySelector('.panel')
    const chartArea   = this.shadowRoot.querySelector('.chart-area')
    const searchInput = this.shadowRoot.querySelector('.search-input')

    // ── Constants ────────────────────────────────────────────────────────────
    const PROXY        = 'https://corsproxy.io/?url='
    const YAHOO_CHART  = 'https://query1.finance.yahoo.com/v8/finance/chart/'
    const YAHOO_SEARCH = 'https://query2.finance.yahoo.com/v1/finance/search?q='

    const RANGE_INTERVALS  = { '1d': '5m', '5d': '15m', '1mo': '1d', '3mo': '1d', '1y': '1wk' }
    const DEFAULT_FAVORITES = ['BTC-USD', 'ETH-USD', 'AAPL', 'GOOGL', 'TSLA']

    // ── Helpers ──────────────────────────────────────────────────────────────
    function proxyFetch(url) {
      return fetch(PROXY + encodeURIComponent(url))
        .then(r => { if (!r.ok) throw new Error('Proxy error'); return r.json() })
    }

    function formatPrice(n) {
      if (n == null || isNaN(n)) return '—'
      return n >= 1
        ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : n.toFixed(6)
    }

    function formatVolume(n) {
      if (n == null) return '—'
      if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
      if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
      if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
      return String(n)
    }

    async function fetchChart(ticker, range) {
      const interval = RANGE_INTERVALS[range] || '1d'
      const url      = `${YAHOO_CHART}${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`
      const data     = await proxyFetch(url)
      const result   = data?.chart?.result?.[0]
      if (!result) throw new Error('No data')
      const timestamps = result.timestamp || []
      const closes     = result.indicators?.quote?.[0]?.close  || []
      const opens      = result.indicators?.quote?.[0]?.open   || []
      const highs      = result.indicators?.quote?.[0]?.high   || []
      const lows       = result.indicators?.quote?.[0]?.low    || []
      const volumes    = result.indicators?.quote?.[0]?.volume || []
      const meta       = result.meta || {}
      const points     = []
      for (let i = 0; i < timestamps.length; i++) {
        if (closes[i] != null) points.push({ t: timestamps[i], c: closes[i] })
      }
      const allCloses = closes.filter(v => v != null)
      const allHighs  = highs.filter(v => v != null)
      const allLows   = lows.filter(v => v != null)
      const allVols   = volumes.filter(v => v != null)
      return {
        ticker,
        points,
        price:     meta.regularMarketPrice ?? allCloses[allCloses.length - 1] ?? null,
        prevClose: meta.chartPreviousClose ?? meta.previousClose ?? null,
        open:      opens.find(v => v != null) ?? null,
        high:      allHighs.length ? Math.max(...allHighs) : null,
        low:       allLows.length  ? Math.min(...allLows)  : null,
        volume:    allVols.length  ? allVols.reduce((a, b) => a + b, 0) : null,
        currency:  meta.currency || 'USD',
      }
    }

    async function searchTickers(query) {
      if (!query || query.length < 1) return []
      const url  = `${YAHOO_SEARCH}${encodeURIComponent(query)}&quotesCount=6&newsCount=0`
      const data = await proxyFetch(url)
      return (data.quotes || [])
        .filter(q => q.symbol && ['EQUITY', 'CRYPTOCURRENCY', 'ETF'].includes(q.quoteType))
        .slice(0, 6)
        .map(q => ({
          symbol:    q.symbol,
          name:      q.shortname || q.longname || q.symbol,
          typeLabel: q.quoteType === 'CRYPTOCURRENCY' ? 'CRYPTO' : q.quoteType,
        }))
    }

    function buildChartSvg(points, isPositive) {
      if (!points || points.length < 2) return ''
      const W = 460, H = 150, PAD_T = 8, PAD_B = 4, PAD_L = 2, PAD_R = 2
      const prices  = points.map(p => p.c)
      const minP    = Math.min(...prices)
      const maxP    = Math.max(...prices)
      const rangeP  = maxP - minP || 1
      const xStep   = (W - PAD_L - PAD_R) / (points.length - 1)
      const coords  = points.map((p, i) => ({
        x: PAD_L + i * xStep,
        y: PAD_T + (1 - (p.c - minP) / rangeP) * (H - PAD_T - PAD_B),
      }))
      const pathD  = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
      const fillD  = pathD + ` L${coords[coords.length - 1].x.toFixed(1)},${H} L${coords[0].x.toFixed(1)},${H} Z`
      const stroke = isPositive ? 'var(--positive)' : 'var(--negative)'
      const fill   = isPositive ? 'var(--positive-glow)' : 'var(--negative-glow)'
      return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="${fill}" />
          <stop offset="100%" stop-color="transparent" />
        </linearGradient></defs>
        <path d="${fillD}" fill="url(#chartGrad)" />
        <path d="${pathD}" fill="none" stroke="${stroke}" stroke-width="1.5" />
      </svg>`
    }

    // ── State ────────────────────────────────────────────────────────────────
    const STATE_DEFAULTS = {
      favorites:       [...DEFAULT_FAVORITES],
      selectedTicker:  '',
      chartRange:      '1d',
      chartLoading:    false,
      chartError:      false,
      priceCache:      {},
      tickerLabel:     '—',
      priceLabel:      '—',
      changeLabel:     '',
      changeUp:        false,
      changeDown:      false,
      openVal:         '—',
      highVal:         '—',
      lowVal:          '—',
      volVal:          '—',
      showPlaceholder: true,
      searchItems:     [],
      searchVisible:   false,
    }

    const state = restate({ ...STATE_DEFAULTS })

    state.use(AsyncPlugin({ maxRetries: 2, defaultTimeout: 8000 }))
    state.use(PersistencePlugin({
      persistKey:      'nx-stock-market',
      persistInclude:  ['favorites'],
      persistDebounce: 500,
    }))

    let chartSvgHtml  = ''
    let searchDebounce = null

    // ── Computed ─────────────────────────────────────────────────────────────
    state.$computed({
      isRange1d(s)  { return s.chartRange === '1d' },
      isRange5d(s)  { return s.chartRange === '5d' },
      isRange1mo(s) { return s.chartRange === '1mo' },
      isRange3mo(s) { return s.chartRange === '3mo' },
      isRange1y(s)  { return s.chartRange === '1y' },
      favData(s) {
        return s.favorites.map(sym => {
          const d         = s.priceCache?.[sym]
          const hasChange = !!(d && d.changePercent != null)
          const isUp      = hasChange && d.changePercent >= 0
          return {
            fullSym:   sym,
            sym:       sym.replace('-USD', ''),
            change:    hasChange ? (isUp ? '+' : '') + d.changePercent.toFixed(2) + '%' : '',
            hasChange,
            isUp,
            isDown:    hasChange && !isUp,
            isSelected: sym === s.selectedTicker,
          }
        })
      },
    })

    // ── Load ticker ──────────────────────────────────────────────────────────
    async function loadTicker(ticker) {
      state.$set(s => {
        s.selectedTicker  = ticker
        s.tickerLabel     = ticker
        s.priceLabel      = '...'
        s.changeLabel     = ''
        s.changeUp        = false
        s.changeDown      = false
        s.openVal         = '...'
        s.highVal         = '...'
        s.lowVal          = '...'
        s.volVal          = '...'
        s.chartLoading    = true
        s.chartError      = false
        s.showPlaceholder = false
      })
      chartSvgHtml = ''

      try {
        const data       = await fetchChart(ticker, state.chartRange)
        const change     = data.prevClose ? data.price - data.prevClose : null
        const changePct  = data.prevClose ? (change / data.prevClose) * 100 : null
        const isPositive = change >= 0
        const changeStr  = change != null
          ? `${isPositive ? '+' : ''}${formatPrice(change)} (${isPositive ? '+' : ''}${changePct.toFixed(2)}%)`
          : ''

        chartSvgHtml = buildChartSvg(data.points, isPositive)

        state.$set(s => {
          s.priceLabel   = formatPrice(data.price)
          s.changeLabel  = changeStr
          s.changeUp     = isPositive
          s.changeDown   = !isPositive
          s.openVal      = formatPrice(data.open)
          s.highVal      = formatPrice(data.high)
          s.lowVal       = formatPrice(data.low)
          s.volVal       = formatVolume(data.volume)
          s.chartLoading = false
          s.chartError   = false
          s.priceCache   = { ...s.priceCache, [ticker]: { price: data.price, changePercent: changePct } }
        })
      } catch {
        chartSvgHtml = ''
        state.$set(s => {
          s.chartLoading = false
          s.chartError   = true
          s.priceLabel   = '—'
          s.changeLabel  = ''
        })
      }
    }

    // ── Methods ──────────────────────────────────────────────────────────────
    state.$methods({
      selectFav(idx) {
        const sym = this.favData[idx]?.fullSym
        if (sym) loadTicker(sym)
      },
      pickSearch(idx) {
        const res = this.searchItems[idx]
        if (res) {
          loadTicker(res.symbol)
          this.$set(s => { s.searchVisible = false; s.searchItems = [] })
          searchInput.value = ''
        }
      },
      pickRange(range) {
        this.chartRange = range
        if (this.selectedTicker) loadTicker(this.selectedTicker)
      },
      addFav() {
        if (!this.selectedTicker) return
        if (!this.favorites.includes(this.selectedTicker)) {
          this.favorites = [...this.favorites, this.selectedTicker]
        }
      },
      removeFav() {
        const ticker = this.selectedTicker
        if (!ticker) return
        this.favorites = this.favorites.filter(s => s !== ticker)
        this.$set(s => {
          s.selectedTicker  = ''
          s.tickerLabel     = '—'
          s.priceLabel      = '—'
          s.changeLabel     = ''
          s.changeUp        = false
          s.changeDown      = false
          s.openVal         = '—'
          s.highVal         = '—'
          s.lowVal          = '—'
          s.volVal          = '—'
          s.showPlaceholder = true
          s.chartLoading    = false
          s.chartError      = false
        })
        chartSvgHtml = ''
      },
      refresh() {
        if (this.selectedTicker) {
          this.$set(s => { s.priceCache = {} })
          loadTicker(this.selectedTicker)
        }
      },
    })

    // ── Search input ─────────────────────────────────────────────────────────
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce)
      const q = searchInput.value.trim()
      if (!q) {
        state.$set(s => { s.searchVisible = false; s.searchItems = [] })
        return
      }
      searchDebounce = setTimeout(async () => {
        try {
          const results = await searchTickers(q)
          state.$set(s => { s.searchItems = results; s.searchVisible = results.length > 0 })
        } catch {
          state.$set(s => { s.searchVisible = false; s.searchItems = [] })
        }
      }, 400)
    })

    searchInput.addEventListener('blur', () => {
      setTimeout(() => state.$set(s => { s.searchVisible = false; s.searchItems = [] }), 200)
    })

    // ── Render ───────────────────────────────────────────────────────────────
    function render() {
      if (state.tickerLabel === undefined) {
        state.$set(s => {
          for (const k in STATE_DEFAULTS) {
            if (s[k] === undefined) s[k] = STATE_DEFAULTS[k]
          }
        })
        return
      }

      reflectx(state, panel)

      if (chartSvgHtml) {
        chartArea.innerHTML = chartSvgHtml
      } else if (state.chartLoading) {
        chartArea.innerHTML = '<span class="chart-loading">LOADING DATA...</span>'
      } else if (state.chartError) {
        chartArea.innerHTML = '<span class="error-msg">SIGNAL LOST — RETRY</span>'
      } else if (state.showPlaceholder) {
        chartArea.innerHTML = '<span class="chart-placeholder">SELECT A TICKER</span>'
      }
    }

    state.$onChange(() => render())
    render()

    // ── Initial load ─────────────────────────────────────────────────────────
    async function loadInitialPrices() {
      for (const sym of state.favorites) {
        try {
          const data      = await fetchChart(sym, '1d')
          const change    = data.prevClose ? data.price - data.prevClose : null
          const changePct = data.prevClose ? (change / data.prevClose) * 100 : null
          state.$set(s => {
            s.priceCache = { ...s.priceCache, [sym]: { price: data.price, changePercent: changePct } }
          })
        } catch { /* skip failed */ }
      }
      if (state.favorites.length > 0) loadTicker(state.favorites[0])
    }

    setTimeout(() => loadInitialPrices(), 500)
  }
}

export default nxStockMarket
