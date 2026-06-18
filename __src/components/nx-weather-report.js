import { restate }  from '/__src/libs/restate/restate.esm.min.js'
import { reflectx } from '/__src/libs/reflectx/reflectx.esm.min.js'

class nxWeatherReport extends HTMLElement {
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
          --accent-dim: #11b3a077;
          --accent-dim-dark: #0f786c77;
          --accent-dim-darker: #0a7e7022;
          --accent-glow: #00e5ca55;
          --accent-scanline: rgba(0, 229, 202, 0.08);

          --text: #60ffe9;
          --text-dim: #7f8ba0;

          --temp-cold: #77ccff;
          --temp-cool: #00e5cc;
          --temp-warm: #ffc852;
          --temp-hot:  #ff5c77;

          --cut:    12px;
          --cut-sm: 8px;
          --gap:    6px;

          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          min-height: 100vh;
          background: inherit;
          color: var(--text);
          font-family: 'Share Tech Mono', monospace;
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

        .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 0 0.25rem; }
        .panel-header .brand { font-family: 'Orbitron', sans-serif; font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); opacity: 0.8; }
        .panel-header .model { font-size: 0.7rem; color: var(--text-dim); letter-spacing: 0.15em; }

        /* ── Search ── */
        .search-section { display: flex; flex-direction: column; gap: 0.35rem; position: relative; }
        .search-label   { font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; }

        .search-input {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.9rem;
          background: var(--surface-button);
          color: var(--text);
          border: 1px solid var(--accent-dim-darker);
          padding: 0.7rem 0.75rem;
          width: 100%;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .search-input::placeholder { color: var(--text-dim); opacity: 0.5; }
        .search-input:focus { border-color: var(--accent); }

        .search-results {
          display: none;
          flex-direction: column;
          gap: 1px;
          max-height: 200px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--accent-dim) var(--surface);
        }
        .search-results.--visible { display: flex; }

        .search-result {
          font-size: 0.78rem;
          color: var(--text-dim);
          padding: 0.5rem 0.75rem;
          background: var(--surface-button);
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
          user-select: none;
        }
        .search-result:hover { background: var(--over-surface-button); color: var(--accent); }

        /* ── Scan button ── */
        .btn-scan {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          border: none;
          cursor: pointer;
          padding: 0.9rem 0;
          background: var(--accent);
          color: var(--screen-bg);
          clip-path: polygon(var(--cut-sm) 0%, 100% 0%, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0% 100%, 0% var(--cut-sm));
          transition: background 0.2s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .btn-scan:hover  { background: var(--accent-light); }
        .btn-scan:active { transform: translateY(1px) scale(0.97); }

        /* ── Display ── */
        .display {
          background: var(--screen-bg);
          padding: 1.25rem;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
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
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, var(--accent-scanline) 2px, var(--accent-scanline) 4px);
          pointer-events: none;
        }

        .display-state { display: none; flex-direction: column; align-items: center; gap: 0.5rem; width: 100%; }
        .display-state.--visible { display: flex; }

        .display-prompt { font-family: 'Orbitron', sans-serif; font-size: 0.9rem; font-weight: 700; color: var(--text-dim); letter-spacing: 0.2em; text-transform: uppercase; }
        .display-prompt.--danger { color: #bd1733; }
        .display-sub { font-size: 0.75rem; color: var(--text-dim); letter-spacing: 0.1em; }

        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .display-prompt.--blink { animation: blink 1.2s ease-in-out infinite; }

        /* ── Weather data ── */
        .weather-location { font-size: 0.75rem; color: var(--text-dim); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 0.25rem; }
        .weather-main     { display: flex; align-items: center; gap: 0.75rem; }
        .weather-icon     { font-size: 2rem; line-height: 1; }
        .weather-desc     { font-family: 'Orbitron', sans-serif; font-size: 0.75rem; font-weight: 700; color: var(--text); letter-spacing: 0.15em; }

        .weather-temp { font-family: 'Orbitron', sans-serif; font-size: 2.8rem; font-weight: 700; text-shadow: 0 0 20px var(--accent-glow); line-height: 1.1; margin: 0.25rem 0; }
        .weather-temp.--cold { color: var(--temp-cold); }
        .weather-temp.--cool { color: var(--temp-cool); }
        .weather-temp.--warm { color: var(--temp-warm); }
        .weather-temp.--hot  { color: var(--temp-hot); }

        .weather-details { display: flex; gap: 2rem; margin: 0.25rem 0; }
        .weather-detail  { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
        .detail-label    { font-size: 0.6rem; color: var(--text-dim); letter-spacing: 0.15em; text-transform: uppercase; }
        .detail-value    { font-family: 'Orbitron', sans-serif; font-size: 0.85rem; font-weight: 700; color: var(--accent); }

        .weather-time       { font-family: 'Orbitron', sans-serif; font-size: 1.1rem; font-weight: 400; color: var(--accent); letter-spacing: 0.1em; margin-top: 0.5rem; text-shadow: 0 0 15px var(--accent-glow); }
        .weather-time-label { font-size: 0.6rem; color: var(--text-dim); letter-spacing: 0.15em; margin-top: 0.15rem; }

        /* ── History ── */
        .history-strip { display: flex; gap: 0.5rem; overflow-x: auto; padding: 0.25rem 0; scrollbar-width: none; }
        .history-strip::-webkit-scrollbar { display: none; }
        .history-item { font-size: 0.6rem; color: var(--text-dim); white-space: nowrap; padding: 0.2rem 0.5rem; background: var(--surface-button); border-radius: 4px; flex-shrink: 0; cursor: pointer; transition: color 0.15s ease; }
        .history-item:hover { color: var(--accent); }

        /* ── Footer ── */
        .panel-footer { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; padding-top: 0.25rem; }
        .panel-footer p { font-size: 0.8rem; color: var(--text-dim); letter-spacing: 0.1em; text-transform: uppercase; }
        .panel-footer a { color: var(--accent); text-decoration: none; opacity: 0.5; }
      </style>

      <div class="panel">
        <div class="panel-header">
          <span class="brand">nativelayer</span>
          <span class="model">NX-WX v1.0</span>
        </div>

        <div class="search-section">
          <label class="search-label">Location</label>
          <input type="text" class="search-input" placeholder="Search any city..." autocomplete="off">
          <div class="search-results" x-class="(--visible, hasResults)">
            <template x-for="(label, idx) in searchLabels">
              <div class="search-result" x-key="idx" x-text="label" @click="selectResult(idx)"></div>
            </template>
          </div>
        </div>

        <button class="btn-scan" @click="scan()">⟐ SCAN</button>

        <div class="display">
          <div class="display-state" x-class="(--visible, isIdle)">
            <div class="display-prompt">AWAITING SIGNAL</div>
            <div class="display-sub">Search a city or scan your location</div>
          </div>
          <div class="display-state" x-class="(--visible, loading)">
            <div class="display-prompt --blink">SCANNING</div>
            <div class="display-sub" x-text="location"></div>
          </div>
          <div class="display-state" x-class="(--visible, hasData)">
            <div class="weather-location" x-text="location"></div>
            <div class="weather-main">
              <span class="weather-icon" x-text="weatherIcon"></span>
              <span class="weather-desc"  x-text="weatherDesc"></span>
            </div>
            <div class="weather-temp"
              x-class="(--cold, isCold), (--cool, isCool), (--warm, isWarm), (--hot, isHot)"
              x-text="tempFormatted"></div>
            <div class="weather-details">
              <div class="weather-detail">
                <span class="detail-label">Wind</span>
                <span class="detail-value" x-text="windFormatted"></span>
              </div>
              <div class="weather-detail">
                <span class="detail-label">Humidity</span>
                <span class="detail-value" x-text="humidityFormatted"></span>
              </div>
            </div>
            <div class="weather-time"       x-text="localTime"></div>
            <div class="weather-time-label" x-text="timezoneLabel"></div>
          </div>
          <div class="display-state" x-class="(--visible, showError)">
            <div class="display-prompt --danger">SIGNAL LOST</div>
            <div class="display-sub" x-text="errorMsg"></div>
          </div>
        </div>

        <div class="history-strip" x-if="history.length > 0">
          <template x-for="(item, idx) in history">
            <div class="history-item" x-key="idx" x-text="item" @click="loadFromHistory(idx)"></div>
          </template>
        </div>

        <div class="panel-footer">
          <p>Powered by restate + reflectx</p>
        </div>
      </div>
    `

    const panel       = this.shadowRoot.querySelector('.panel')
    const searchInput = this.shadowRoot.querySelector('.search-input')

    // ── WMO weather codes ─────────────────────────────────────────────────
    const WMO = {
      0:  ['CLEAR SKY',        '◉'],  1:  ['MOSTLY CLEAR',     '◎'],
      2:  ['PARTLY CLOUDY',    '◑'],  3:  ['OVERCAST',         '●'],
      45: ['FOG',              '≡'],  48: ['RIME FOG',         '≡'],
      51: ['LIGHT DRIZZLE',    '∴'],  53: ['DRIZZLE',          '∴'],
      55: ['DENSE DRIZZLE',    '∵'],  56: ['FREEZING DRIZZLE', '∵'],
      57: ['HEAVY FRZ DRIZZLE','∵'],  61: ['LIGHT RAIN',       '▽'],
      63: ['RAIN',             '▼'],  65: ['HEAVY RAIN',       '▼'],
      66: ['FREEZING RAIN',    '▼'],  67: ['HEAVY FRZ RAIN',   '▼'],
      71: ['LIGHT SNOW',       '✦'],  73: ['SNOW',             '✦'],
      75: ['HEAVY SNOW',       '✦'],  77: ['SNOW GRAINS',      '✦'],
      80: ['LIGHT SHOWERS',   '▽'],   81: ['SHOWERS',          '▼'],
      82: ['VIOLENT SHOWERS',  '▼'],  85: ['LIGHT SNOW SHWR',  '✦'],
      86: ['HEAVY SNOW SHWR',  '✦'],  95: ['THUNDERSTORM',     '⚡'],
      96: ['THUNDER + HAIL',   '⚡'],  99: ['SEVERE THUNDER',   '⚡'],
    }

    let searchData   = []
    const historyLookup = {}
    let timeInterval = null

    function debounce(fn, ms) {
      let timer
      return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms) }
    }

    async function fetchWeather(lat, lng) {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`
      const res = await fetch(url)
      if (!res.ok) throw new Error('API error')
      return res.json()
    }

    async function searchCity(query) {
      if (query.length < 2) { searchData = []; state.searchLabels = []; return }
      try {
        const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en`)
        const data = await res.json()
        if (!data.results?.length) { searchData = []; state.searchLabels = []; return }
        searchData = data.results.map(r => ({ name: r.name, country: r.country || '', admin1: r.admin1 || '', lat: r.latitude, lng: r.longitude }))
        state.searchLabels = searchData.map(r => [r.name, r.admin1, r.country].filter(Boolean).join(', '))
      } catch { searchData = []; state.searchLabels = [] }
    }

    const debouncedSearch = debounce(searchCity, 400)
    searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value.trim()))

    function startClock(timezone) {
      clearInterval(timeInterval)
      const tick = () => {
        try {
          state.localTime = new Date().toLocaleTimeString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        } catch { state.localTime = '--:--:--' }
      }
      tick()
      timeInterval = setInterval(tick, 1000)
    }

    function loadWeather(loc, lat, lng) {
      state.$set(s => { s.loading = true; s.error = false; s.location = loc; s.searchLabels = [] })
      fetchWeather(lat, lng)
        .then(data => {
          historyLookup[loc] = { lat, lng }
          const hist    = [...state.history]
          const existing = hist.indexOf(loc)
          if (existing > -1) hist.splice(existing, 1)
          hist.unshift(loc)
          if (hist.length > 8) { const removed = hist.pop(); delete historyLookup[removed] }
          state.$set(s => {
            s.temperature = data.current.temperature_2m
            s.weatherCode = data.current.weather_code
            s.windSpeed   = data.current.wind_speed_10m
            s.humidity    = data.current.relative_humidity_2m
            s.timezone    = data.timezone
            s.timezoneAbbr = data.timezone_abbreviation
            s.loading     = false
            s.history     = hist
            s.currentLat  = lat
            s.currentLng  = lng
          })
          startClock(data.timezone)
        })
        .catch(() => state.$set(s => { s.error = true; s.errorMsg = 'CONNECTION FAILED'; s.loading = false }))
    }

    // ── State ────────────────────────────────────────────────────────────────
    const state = restate({
      location: '', loading: false, temperature: null, weatherCode: null,
      windSpeed: null, humidity: null, timezone: '', timezoneAbbr: '',
      localTime: '', error: false, errorMsg: '', history: [],
      searchLabels: [], currentLat: null, currentLng: null,
    })

    state.$computed({
      isIdle(s)    { return s.temperature === null && !s.loading && !s.error },
      hasData(s)   { return s.temperature !== null && !s.loading && !s.error },
      showError(s) { return s.error && !s.loading },
      hasResults(s){ return s.searchLabels.length > 0 },

      weatherDesc(s) { const w = WMO[s.weatherCode]; return w ? w[0] : 'UNKNOWN' },
      weatherIcon(s) { const w = WMO[s.weatherCode]; return w ? w[1] : '?' },

      tempFormatted(s)  { return s.temperature === null ? '—' : s.temperature.toFixed(1) + '°C' },
      windFormatted(s)  { return s.windSpeed === null    ? '—' : s.windSpeed.toFixed(1) + ' km/h' },
      humidityFormatted(s){ return s.humidity === null   ? '—' : s.humidity + '%' },

      isCold(s) { return s.temperature !== null && s.temperature <= 5 },
      isCool(s) { return s.temperature !== null && s.temperature > 5 && s.temperature <= 18 },
      isWarm(s) { return s.temperature !== null && s.temperature > 18 && s.temperature <= 30 },
      isHot(s)  { return s.temperature !== null && s.temperature > 30 },

      timezoneLabel(s) { return s.timezoneAbbr ? 'LOCAL TIME · ' + s.timezoneAbbr : '' },
    })

    state.$methods({
      selectResult(idx) {
        const d = searchData[idx]
        if (!d) return
        const loc = d.name + ', ' + d.country
        searchInput.value = loc
        searchData = []
        loadWeather(loc, d.lat, d.lng)
      },
      scan() {
        if (state.loading) return
        if (!navigator.geolocation) {
          state.$set(s => { s.error = true; s.errorMsg = 'GEOLOCATION NOT AVAILABLE' }); return
        }
        state.$set(s => { s.loading = true; s.error = false; s.location = 'DETECTING...'; s.searchLabels = [] })
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude, lng = pos.coords.longitude
            fetch(`https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${lat}&longitude=${lng}&count=1&language=en`)
              .then(r => r.json())
              .then(geo => {
                let loc = lat.toFixed(2) + ', ' + lng.toFixed(2)
                if (geo.results?.length) { const r = geo.results[0]; loc = r.name + ', ' + (r.country || '') }
                searchInput.value = loc
                loadWeather(loc, lat, lng)
              })
              .catch(() => loadWeather(lat.toFixed(2) + ', ' + lng.toFixed(2), lat, lng))
          },
          () => state.$set(s => { s.error = true; s.errorMsg = 'LOCATION ACCESS DENIED'; s.loading = false }),
          { enableHighAccuracy: false, timeout: 10000 }
        )
      },
      loadFromHistory(idx) {
        const loc  = state.history[idx]
        const data = historyLookup[loc]
        if (!data) return
        searchInput.value = loc
        loadWeather(loc, data.lat, data.lng)
      },
    })

    // ── Render ────────────────────────────────────────────────────────────────
    const render = () => reflectx(state, panel)
    state.$onChange(() => render())
    render()
  }

  disconnectedCallback() {
    if (this._timeInterval) clearInterval(this._timeInterval)
  }
}

export default nxWeatherReport
