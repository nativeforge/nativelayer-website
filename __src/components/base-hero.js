import { observeThemeModeRoot } from '/__src/js/theme-mode-host.js';
import { applyAccentColorHsl } from '/__src/js/luminance.js';

const MESH_LOGOS = [
  { id: 'html5', src: '/__src/img/html5-logo.svg', weight: 8 },
  { id: 'css3', src: '/__src/img/css3-logo.svg', weight: 8 },
  { id: 'javascript', src: '/__src/img/javascript-logo.svg', weight: 8 },
  { id: 'reflectx', src: '/__src/img/reflectx-logo.svg', accent: '130 100% 50%', weight: 4 },
  { id: 'routerx', src: '/__src/img/routerx-logo.svg', accent: '348 100% 50%', weight: 4 },
  { id: 'restate', src: '/__src/img/restate-logo.svg', accent: '220 100% 50%', weight: 4 },
  { id: 'remd', src: '/__src/img/remd-logo.svg', accent: '260 100% 50%', weight: 2 },
  { id: 'doc-quick', src: '/__src/img/doc-quick-logo.svg', accent: '25 100% 50%', weight: 2 },
  { id: 'monitor-loading', src: '/__src/img/monitor-loading-logo.svg', weight: 1 },
  { id: 'makeReady', src: '/__src/img/makeReady-logo.svg', weight: 1 },
  { id: 'autoDefine', src: '/__src/img/autoDefine-logo.svg', weight: 1 },
  { id: 'readyElement', src: '/__src/img/readyElement-logo.svg', weight: 1 },
  { id: 'waitForElementsReady', src: '/__src/img/waitForElementsReady-logo.svg', weight: 1 },
  { id: 'svg-insert', src: '/__src/img/svg-insert-logo.svg', weight: 1 },
];

const MAX_MESH_LOGOS = 3;
const LOGO_CENTER_ROWS = 4;
const _svgCache = new Map();

function pickWeightedLogo(logos) {
  const total = logos.reduce((sum, logo) => sum + logo.weight, 0);
  let roll = Math.random() * total;

  for (const logo of logos) {
    roll -= logo.weight;
    if (roll < 0) return logo;
  }

  return logos[logos.length - 1];
}

class baseHero extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._meshTimer = null;
    this._resizeObs = null;
    this._activeCells = new Map();
    this._cells = [];
  }

  static get observedAttributes() {
    return ['mesh-logos'];
  }

  connectedCallback() {
    this._render();
    this._themeObserver = observeThemeModeRoot(this);
    if (this.hasAttribute('mesh-logos')) {
      this._initMeshLogos();
    }
  }

  disconnectedCallback() {
    this._themeObserver?.disconnect();
    this._teardownMeshLogos();
  }

  attributeChangedCallback(name) {
    if (name !== 'mesh-logos' || !this.shadowRoot?.innerHTML) return;
    if (this.hasAttribute('mesh-logos')) this._initMeshLogos();
    else this._teardownMeshLogos();
  }

  _render() {
    const meshEnabled = this.hasAttribute('mesh-logos');

    this.shadowRoot.innerHTML = `
    <style>
      *, *::before, *::after { box-sizing: border-box; }

      :host {
        --hero-pattern-hsl: var(--fcolor-hsl);
        --hero-pattern-opacity: 0.05;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: calc(var(--space-unit) * 2);
        width: 100%;
        padding-block: calc(var(--space-unit) * 8);
        overflow: hidden;
      }

      :host([theme-mode="light"]) {
        --hero-pattern-opacity: 0.1;
      }

      :host([theme-mode="light"]) .mesh-logo-wrap.--accent-is-light {
        --accent-color-hsl: var(--accent-color-hsl-adjusted) !important;
      }

      @media (prefers-color-scheme: light) {
        :host(:not([theme-mode="dark"])) {
          --hero-pattern-opacity: 0.1;
        }

        :host(:not([theme-mode="dark"])) .mesh-logo-wrap.--accent-is-light {
          --accent-color-hsl: var(--accent-color-hsl-adjusted) !important;
        }
      }

      .hero-grid-bg {
        position: absolute;
        inset: 0;
        z-index: 0;
        background-image:
          linear-gradient(hsl(var(--hero-pattern-hsl) / var(--hero-pattern-opacity)) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--hero-pattern-hsl) / var(--hero-pattern-opacity)) 1px, transparent 1px);
        background-size: calc(var(--space-unit) * 8) calc(var(--space-unit) * 8);
        mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
        pointer-events: none;
      }

      .mesh-measurer {
        position: absolute;
        visibility: hidden;
        pointer-events: none;
        width: calc(var(--space-unit) * 8);
        height: calc(var(--space-unit) * 8);
      }

      .hero-mesh-logos {
        position: absolute;
        inset: 0;
        z-index: 1;
        display: grid;
        pointer-events: none;
        mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
      }

      .mesh-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .mesh-logo-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 55%;
        height: 55%;
        opacity: 0;
        transform: scale(0.75);
        transition: opacity 0.45s ease, transform 0.45s ease;
      }

      .mesh-logo-wrap svg {
        width: 100%;
        height: 100%;
        display: block;
      }

      .mesh-cell.--active .mesh-logo-wrap {
        opacity: 0.88;
        transform: scale(1);
      }

      .hero-content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        align-items: inherit;
        justify-content: inherit;
        gap: inherit;
        width: 100%;
      }

      .hero-content :where(h1, h2, h3, h4, h5, h6) {
        font-family: var(--ff-1);
      }

      .hero-content :where(p, span) {
        font-family: var(--ff-2);
        font-weight: 300;
      }

      @media (max-width: 40rem) {
        .hero-mesh-logos { display: none; }
      }

      @media (prefers-reduced-motion: reduce) {
        .hero-mesh-logos { display: none; }
      }
    </style>

    <div class="hero-grid-bg" aria-hidden="true"></div>
    <div class="mesh-measurer" aria-hidden="true"></div>
    <div class="hero-mesh-logos" aria-hidden="true"${meshEnabled ? '' : ' hidden'}></div>

    <div class="hero-content">
      <slot name="title"></slot>
      <slot name="description"></slot>
    </div>
    `;
  }

  _initMeshLogos() {
    this._teardownMeshLogos();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const stage = this.shadowRoot.querySelector('.hero-mesh-logos');
    if (!stage) return;

    stage.hidden = false;
    this._buildMeshGrid();

    this._resizeObs = new ResizeObserver(() => this._buildMeshGrid());
    this._resizeObs.observe(this);
    this._scheduleMeshTick();
  }

  _teardownMeshLogos() {
    clearTimeout(this._meshTimer);
    this._meshTimer = null;
    this._resizeObs?.disconnect();
    this._resizeObs = null;

    this._activeCells.forEach(({ timer }) => clearTimeout(timer));
    this._activeCells.clear();
    this._cells = [];

    const stage = this.shadowRoot?.querySelector('.hero-mesh-logos');
    if (stage) {
      stage.innerHTML = '';
      if (!this.hasAttribute('mesh-logos')) stage.hidden = true;
    }
  }

  _getCellSize() {
    const measurer = this.shadowRoot.querySelector('.mesh-measurer');
    return measurer?.offsetWidth || 64;
  }

  _buildMeshGrid() {
    const stage = this.shadowRoot.querySelector('.hero-mesh-logos');
    if (!stage || stage.hidden) return;

    this._activeCells.forEach(({ timer }) => clearTimeout(timer));
    this._activeCells.clear();

    const cellSize = this._getCellSize();
    const { width, height } = this.getBoundingClientRect();
    const cols = Math.max(1, Math.floor(width / cellSize));
    const rows = Math.max(1, Math.floor(height / cellSize));
    const rightColStart = Math.ceil(cols / 2);
    const centerRows = Math.min(LOGO_CENTER_ROWS, rows);
    const rowStart = Math.floor((rows - centerRows) / 2);
    const rowEnd = rowStart + centerRows;

    stage.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
    stage.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
    stage.innerHTML = '';
    this._cells = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = document.createElement('div');
        cell.className = 'mesh-cell';
        const index = row * cols + col;
        cell.dataset.index = String(index);

        const entry = {
          el: cell,
          col,
          row,
          index,
          eligible: col >= rightColStart
            && row >= rowStart
            && row < rowEnd
            && row > 0
            && row < rows - 1,
        };
        if (entry.eligible) cell.dataset.eligible = 'true';

        stage.appendChild(cell);
        this._cells.push(entry);
      }
    }
  }

  _scheduleMeshTick() {
    this._meshTimer = setTimeout(() => {
      this._meshTick();
      this._scheduleMeshTick();
    }, 700 + Math.random() * 800);
  }

  _activeLogoIds() {
    return [...this._activeCells.values()].map(({ logoId }) => logoId);
  }

  _availableLogos() {
    const active = new Set(this._activeLogoIds());
    return MESH_LOGOS.filter((logo) => !active.has(logo.id));
  }

  async _fetchSvg(src) {
    if (_svgCache.has(src)) return _svgCache.get(src).cloneNode(true);

    const res = await fetch(src);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) throw new Error(`No SVG in ${src}`);

    _svgCache.set(src, svg.cloneNode(true));
    return svg;
  }

  _meshTick() {
    const eligible = this._cells.filter(
      (c) => c.eligible
        && !this._activeCells.has(c.index)
        && !c.el.querySelector('.mesh-logo-wrap')
    );
    const available = this._availableLogos();

    if (
      this._activeCells.size < MAX_MESH_LOGOS &&
      eligible.length &&
      available.length
    ) {
      const cell = eligible[Math.floor(Math.random() * eligible.length)];
      this._activateCell(cell);
      return;
    }

    if (this._activeCells.size >= MAX_MESH_LOGOS) {
      const keys = [...this._activeCells.entries()]
        .filter(([, entry]) => !entry.leaving)
        .map(([index]) => index);
      if (keys.length) this._deactivateCell(keys[Math.floor(Math.random() * keys.length)]);
    }
  }

  async _activateCell(cell) {
    if (this._activeCells.has(cell.index) || cell.el.querySelector('.mesh-logo-wrap')) return;

    const available = this._availableLogos();
    if (!available.length) return;

    const logo = pickWeightedLogo(available);
    this._activeCells.set(cell.index, { timer: null, cell, logoId: logo.id });

    const wrap = document.createElement('div');
    wrap.className = 'mesh-logo-wrap';
    wrap.setAttribute('aria-hidden', 'true');

    if (logo.accent) {
      applyAccentColorHsl(wrap, logo.accent);
    }

    cell.el.appendChild(wrap);

    try {
      const svg = await this._fetchSvg(logo.src);
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      wrap.appendChild(svg);
    } catch {
      wrap.remove();
      this._activeCells.delete(cell.index);
      return;
    }

    const entry = this._activeCells.get(cell.index);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this._activeCells.get(cell.index) !== entry || entry.leaving || !wrap.isConnected) return;

        cell.el.classList.add('--active');
        const enter = wrap.getAnimations();

        Promise.all(enter.map((animation) => animation.finished.catch(() => {}))).then(() => {
          if (this._activeCells.get(cell.index) !== entry || entry.leaving) return;
          const duration = 1600 + Math.random() * 2400;
          entry.timer = setTimeout(() => this._deactivateCell(cell.index), duration);
        });
      });
    });
  }

  _deactivateCell(index) {
    const entry = this._activeCells.get(index);
    if (!entry || entry.leaving) return;

    clearTimeout(entry.timer);
    entry.leaving = true;
    entry.cell.el.classList.remove('--active');

    const wrap = entry.cell.el.querySelector('.mesh-logo-wrap');
    entry.timer = setTimeout(() => {
      wrap?.remove();
      if (this._activeCells.get(index) === entry) this._activeCells.delete(index);
    }, 450);
  }
}

export default baseHero;
