import { observeThemeModeRoot } from '/__src/js/theme-mode-host.js';

class blogHero extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._animFrame = null
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = this._HTML
    this._themeObserver = observeThemeModeRoot(this)
    this._startGlitch()
  }

  disconnectedCallback() {
    this._themeObserver?.disconnect()
    if (this._animFrame) cancelAnimationFrame(this._animFrame)
    if (this._glitchTimeout) clearTimeout(this._glitchTimeout)
  }

  _startGlitch() {
    const glitch = this.shadowRoot.querySelector('.hero-glitch')
    if (!glitch) return

    const scheduleNext = () => {
      const delay = 2000 + Math.random() * 5000
      this._glitchTimeout = setTimeout(() => {
        glitch.classList.add('--active')
        setTimeout(() => {
          glitch.classList.remove('--active')
          scheduleNext()
        }, 120 + Math.random() * 80)
      }, delay)
    }
    scheduleNext()
  }

  get _HTML() {
    return `
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-end;
        width: 100%;
        max-width: 75rem;
        margin-inline: auto;
        min-height: calc(100dvh - var(--top-bar-height, calc(var(--space-unit) * 6)));
        padding: calc(var(--space-unit) * 10) var(--page-padding-x);
        overflow: hidden;
      }

      /* Grid background */
      .hero-grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(var(--blog-accent-grid) 1px, transparent 1px),
          linear-gradient(90deg, var(--blog-accent-grid) 1px, transparent 1px);
        background-size: calc(var(--space-unit) * 8) calc(var(--space-unit) * 8);
        mask-image: linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%);
        pointer-events: none;
      }

      /* Radial glow */
      .hero-glow {
        position: absolute;
        inset: 0;
        background: radial-gradient(
          ellipse 70% 60% at 50% 100%,
          var(--blog-accent-wash) 0%,
          transparent 70%
        );
        pointer-events: none;
      }

      /* Scanlines */
      .hero-scanlines {
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
          to bottom,
          transparent 0px,
          transparent 3px,
          var(--blog-fg-grid) 3px,
          var(--blog-fg-grid) 4px
        );
        pointer-events: none;
      }

      /* Animated horizontal scan line */
      .hero-scan-beam {
        position: absolute;
        left: 0;
        right: 0;
        height: calc(var(--space-unit) * 1);
        background: linear-gradient(
          to right,
          transparent,
          var(--blog-accent-radar),
          transparent
        );
        animation: scan-beam 6s linear infinite;
        pointer-events: none;
      }

      :host([theme-mode="light"]) .hero-scan-beam {
        background: linear-gradient(
          to right,
          transparent,
          hsl(from white h s l / 0.75),
          transparent
        );
      }

      @keyframes scan-beam {
        0%   { top: -2%; }
        100% { top: 102%; }
      }

      .hero-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: calc(var(--space-unit) * 3);
      }

      .hero-eyebrow {
        font-family: var(--ff-3, 'JetBrains Mono', monospace);
        font-size: var(--f-size-s);
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--blog-accent);
        text-shadow: 0 0 calc(var(--space-unit) * 3) var(--blog-accent-glow-strong);
      }
      :host([theme-mode="light"]) .hero-eyebrow {
        color: var(--blog-accent-darken2);
        text-shadow: none;
      }

      /* blinking cursor after eyebrow */
      .hero-eyebrow::after {
        content: '_';
        animation: blink 1s step-end infinite;
      }

      @keyframes blink {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0; }
      }

      /* glitch wrapper */
      .hero-glitch {
        position: relative;
        display: inline-block;
      }

      .hero-glitch.--active .hero-title-main {
        animation: glitch-main 0.1s steps(2) forwards;
      }

      .hero-glitch.--active .hero-title-clone-1 {
        opacity: 1;
        animation: glitch-clone-1 0.1s steps(2) forwards;
      }

      .hero-glitch.--active .hero-title-clone-2 {
        opacity: 1;
        animation: glitch-clone-2 0.1s steps(2) forwards;
      }

      .hero-title-main {
        font-family: var(--ff-1, 'Syncopate', sans-serif);
        font-size: var(--f-size-2xl);
        font-weight: 700;
        letter-spacing: 0.04em;
        line-height: 1.1;
        color: var(--blog-color-fg);
        text-shadow: 0 0 calc(var(--space-unit) * 1) var(--blog-fg-ghost);
        display: block;
      }

      .hero-title-clone-1,
      .hero-title-clone-2 {
        position: absolute;
        inset: 0;
        font-family: var(--ff-1, 'Syncopate', sans-serif);
        font-size: var(--f-size-2xl);
        font-weight: 700;
        letter-spacing: 0.04em;
        line-height: 1.1;
        opacity: 0;
        pointer-events: none;
        clip-path: polygon(0 20%, 100% 20%, 100% 35%, 0 35%);
      }

      .hero-title-clone-1 {
        color: var(--blog-accent);
        clip-path: polygon(0 15%, 100% 15%, 100% 30%, 0 30%);
      }

      .hero-title-clone-2 {
        color: var(--blog-accent-secondary);
        clip-path: polygon(0 55%, 100% 55%, 100% 70%, 0 70%);
      }

      @keyframes glitch-main {
        0%   { transform: translate(0, 0); }
        33%  { transform: translate(calc(var(--size-unit) * -0.5), 0); }
        66%  { transform: translate(calc(var(--size-unit) * 0.5), 0); }
        100% { transform: translate(0, 0); }
      }

      @keyframes glitch-clone-1 {
        0%   { transform: translate(calc(var(--size-unit) * -1), 0); opacity: 0.8; }
        50%  { transform: translate(calc(var(--size-unit) * 1.5), 0); opacity: 0.6; }
        100% { transform: translate(0, 0); opacity: 0; }
      }

      @keyframes glitch-clone-2 {
        0%   { transform: translate(calc(var(--size-unit) * 1), 0); opacity: 0.7; }
        50%  { transform: translate(calc(var(--size-unit) * -1.5), 0); opacity: 0.5; }
        100% { transform: translate(0, 0); opacity: 0; }
      }

      .hero-sub {
        font-family: var(--ff-2, 'Inconsolata', monospace);
        font-size: var(--f-size-p);
        line-height: 1.65;
        color: var(--blog-fg-muted);
        max-width: 42rem;
      }

      .hero-slot {
        margin-top: calc(var(--space-unit) * 2);
      }

      @media (prefers-reduced-motion: reduce) {
        .hero-scan-beam,
        .hero-glitch.--active .hero-title-main,
        .hero-glitch.--active .hero-title-clone-1,
        .hero-glitch.--active .hero-title-clone-2 {
          animation: none !important;
        }
        .hero-eyebrow::after {
          animation: none !important;
          opacity: 1;
        }
      }
    </style>

    <div class="hero-grid" aria-hidden="true"></div>
    <div class="hero-glow" aria-hidden="true"></div>
    <div class="hero-scanlines" aria-hidden="true"></div>
    <div class="hero-scan-beam" aria-hidden="true"></div>

    <div class="hero-content">
      <slot name="eyebrow">
        <span class="hero-eyebrow"><slot name="eyebrow-text">–– BROADCAST</slot></span>
      </slot>

      <div class="hero-glitch">
        <slot name="title">
          <span class="hero-title-main">nullsignal</span>
          <span class="hero-title-clone-1" aria-hidden="true">nullsignal</span>
          <span class="hero-title-clone-2" aria-hidden="true">nullsignal</span>
        </slot>
      </div>

      <slot name="description">
        <p class="hero-sub">Classified dispatches from the web platform. Sorted by signal, tagged by topic.</p>
      </slot>

      <div class="hero-slot">
        <slot></slot>
      </div>
    </div>
    `
  }
}

export default blogHero
