import { luminanceHSL, adjustedHSL }  from '/__src/js/luminance.js'
import { scrollToHeadingElement }      from '/__src/js/utils.js'

// ── Child component imports (self-contained: no external autoDefine needed) ──
import docCard          from '/__src/components/doc-card.js'
import docBodyClass     from '/__src/components/doc-body.js'
import docAsideClass    from '/__src/components/doc-aside.js'
import reMd            from '/__src/components/re-md/index.js'

const define = (tag, cls) => { if (!customElements.get(tag)) customElements.define(tag, cls) }
define('re-md',          reMd)
define('doc-body',       docBodyClass)
define('doc-aside',      docAsideClass)
define('doc-card',       docCard)

// ───────────────────────────────────────────────────────────────────────────
// <doc-quick> — self-contained documentation viewer
//
// Wraps <doc-aside> + <doc-body> + <re-md> into a single element.
// Absorbs chapter-activation, theme application, and hash handling so that
// router.js only needs to set attributes — no direct DOM manipulation.
//
// Attributes:
//   src               — markdown URL forwarded to internal <re-md>
//   hash              — heading/chapter id to activate (e.g. '0-introduction')
//   theme-color-hsl   — HSL string applied as --accent-color-hsl on <html>
//   chapter-mode      — boolean; forwarded to <re-md>
//   syntax-css        — CSS URL forwarded to <re-md>
//   hljs-src          — highlight.js URL forwarded to <re-md> (CDN default used when omitted)
//   expander-color    — forwarded to <doc-aside>
//   section-numbers   — boolean; forwarded to <doc-aside>
// ───────────────────────────────────────────────────────────────────────────

class docQuick extends HTMLElement {
  static get observedAttributes() {
    return [
      'src', 'hash', 'theme-color-hsl',
      'chapter-mode', 'syntax-css', 'hljs-src',
      'expander-color', 'section-numbers',
    ]
  }

  constructor() {
    super()
    this._remd      = null
    this._docBody   = null
    this._docAside  = null
    this._htmlEl    = null
    // Pending chapter-activation handles
    this._pendingObserver       = null
    this._pendingSafetyTimeout  = null
  }

  connectedCallback() {
    this._htmlEl = document.querySelector('html')
    this._render()

    this._remd     = this.querySelector('re-md')
    this._docBody  = this.querySelector('doc-body')
    this._docAside = this.querySelector('doc-aside')

    // ── Single navigation pipeline ───────────────────────────────────────
    // One delegated click listener catches every internal navigation source:
    //   - <a href="#…"> in <doc-aside> (light DOM)
    //   - <a class="doc-card-link"> inside <doc-card> shadow root
    //   - <h1>…<h6> with an id inside <doc-body> / <re-md>
    // We rely on e.composedPath() to see across shadow boundaries.
    // After identifying the hash we pushState + setAttribute('hash', …); the
    // attributeChangedCallback is the single source of truth that runs
    // chapter activation and scroll.
    this.addEventListener('click', (e) => {
      const path = e.composedPath()

      // 1) Anchor with hash href
      const anchor = path.find(n =>
        n && n.tagName === 'A' &&
        typeof n.getAttribute === 'function' &&
        (n.getAttribute('href') || '').startsWith('#')
      )

      // 2) Otherwise: heading with an id (only headings inside doc-body)
      const heading = !anchor && path.find(n =>
        n && /^H[1-6]$/.test(n.tagName || '') && n.id
      )

      if (!anchor && !heading) return

      e.preventDefault()
      e.stopPropagation()

      const hash = anchor
        ? anchor.getAttribute('href').slice(1)
        : heading.id
      if (!hash) return

      if (heading) {
        const url = `${window.location.origin}${window.location.pathname}#${hash}`
        this._docBody?.copyToClipboard?.(url, heading)
      }

      this._navigate(hash)
    })

    // Apply any attributes that were set before connectedCallback ran
    const src   = this.getAttribute('src')
    const hash  = this.getAttribute('hash')
    const theme = this.getAttribute('theme-color-hsl')

    if (src   && this._remd)  this._remd.setAttribute('src', src)
    if (theme) this._applyTheme(theme)
    if (hash)  this._activateChapterWhenReady(hash)
  }

  disconnectedCallback() {
    this._cleanupChapterActivation()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return

    switch (name) {
      case 'src':
        if (this._remd) this._remd.setAttribute('src', newValue || '')
        break

      case 'hash':
        this._cleanupChapterActivation()
        if (newValue) this._activateChapterWhenReady(newValue)
        break

      case 'theme-color-hsl':
        this._applyTheme(newValue)
        break

      case 'chapter-mode':
        if (this._remd) {
          newValue !== null
            ? this._remd.setAttribute('chapter-mode', '')
            : this._remd.removeAttribute('chapter-mode')
        }
        break

      case 'syntax-css':
        if (this._remd && newValue) this._remd.setAttribute('syntax-css', newValue)
        break

      case 'hljs-src':
        if (this._remd && newValue) this._remd.setAttribute('hljs-src', newValue)
        break

      case 'expander-color':
        if (this._docAside && newValue) this._docAside.setAttribute('expander-color', newValue)
        break

      case 'section-numbers':
        if (this._docAside) {
          newValue !== null
            ? this._docAside.setAttribute('section-numbers', '')
            : this._docAside.removeAttribute('section-numbers')
        }
        break
    }
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  _render() {
    const chapterMode = this.hasAttribute('chapter-mode') ? 'chapter-mode' : ''
    const sectionNums = this.hasAttribute('section-numbers') ? 'section-numbers' : ''
    const themeCss = this.getAttribute('syntax-css') || ''
    const expanderColor = this.getAttribute('expander-color') || ''
    const src = this.getAttribute('src') || ''
    const hljsSrc = this.getAttribute('hljs-src') || ''

    this.innerHTML = `
      <style>
        .doc-quick-cards {
          display: flex;
          flex-direction: row;
          gap: calc(var(--space-unit) * 4);
          width: 100%;
          flex-shrink: 0;
          margin-top: calc(var(--space-unit) * 8);
        }
      </style>
      <doc-aside
        ${expanderColor ? `expander-color="${expanderColor}"` : ''}
        ${sectionNums}
      ></doc-aside>
      <doc-body>
        <re-md
          ${src ? `src="${src}"` : ''}
          ${themeCss ? `syntax-css="${themeCss}"` : ''}
          ${hljsSrc ? `hljs-src="${hljsSrc}"` : ''}
          ${chapterMode}
        ></re-md>
        ${chapterMode ? `
        <div class="doc-quick-cards">
          <doc-card data-label="previous"></doc-card>
          <doc-card data-label="next"></doc-card>
        </div>` : ''}
      </doc-body>
    `
  }

  // ── Theme ─────────────────────────────────────────────────────────────────

  _applyTheme(hsl) {
    if (!this._htmlEl || !hsl) return

    const parts        = hsl.replaceAll('%', '').split(' ').map(Number)
    const lum          = luminanceHSL(...parts)
    const isLight      = lum > 0.6
    const adjustedSoft = adjustedHSL(hsl, {
      min: 30, max: 58, strength: 1, maxShift: 30,
    })
    const adjustedHard = isLight
      ? adjustedHSL(hsl, { min: 25, max: 40, strength: 0.2, maxShift: 65 })
      : adjustedSoft

    this._htmlEl.style.setProperty('--accent-color-hsl',          hsl)
    this._htmlEl.style.setProperty('--accent-color-hsl-adjusted-soft',  adjustedSoft)
    this._htmlEl.style.setProperty('--accent-color-hsl-adjusted-hard',  adjustedHard)
    this._htmlEl.style.setProperty('--accent-color-hsl-adjusted', adjustedSoft)

    if (lum > 0.6) {
      this._htmlEl.classList.remove('--accent-is-dark')
      this._htmlEl.classList.add('--accent-is-light')
    } else if (lum < 0.1) {
      this._htmlEl.classList.remove('--accent-is-light')
      this._htmlEl.classList.add('--accent-is-dark')
    } else {
      this._htmlEl.classList.remove('--accent-is-light', '--accent-is-dark')
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  _navigate(hash) {
    const newUrl = `${window.location.pathname}#${hash}`
    window.history.pushState({}, '', newUrl)
    if (this.getAttribute('hash') === hash) {
      // Same hash → attributeChangedCallback won't fire. Re-run activation
      // explicitly so a click on the already-active section still scrolls.
      this._cleanupChapterActivation()
      this._activateChapterWhenReady(hash)
    } else {
      this.setAttribute('hash', hash)
    }
  }

  // ── Chapter activation ────────────────────────────────────────────────────

  _activateChapter(hash) {
    if (!this._remd || !hash) return false

    const contentWrapper = this._remd.querySelector('div[ref="re-md-content"]')
    if (!contentWrapper) return false

    let activeSection = contentWrapper.querySelector(`section[ref="${hash}"]`)
    if (!activeSection) {
      const heading = document.getElementById(hash)
      activeSection = heading?.closest('section')
    }
    if (!activeSection) return false
    contentWrapper.querySelectorAll('section').forEach(s =>
      s.classList.remove('--chapter-active')
    )
    activeSection.classList.add('--chapter-active')

    if (this._docBody?.chapterMap) {
      const ref   = activeSection.getAttribute('ref')
      const index = this._docBody.chapterMap.indexOf(ref)
      if (index !== -1) this._docBody.chapterIndex = index
    }

    this._docAside?.activateNavItem?.(hash)

    return true
  }

  // Scroll to the element matching `hash`.
  // Real heading IDs (e.g. "1-installation", "2-1-core-methods") are found
  // directly via getElementById. Synthetic chapter keys like "0-introduction"
  // have no matching element — they always map to the first section, so we
  // scroll to the absolute top of the page instead.
  _scrollTo(hash) {
    const el = document.getElementById(hash)
    if (el) {
      scrollToHeadingElement(el)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  _activateChapterWhenReady(hash) {
    if (!hash || !this._remd) return

    // Try once — re-md content may already be present.
    if (this._activateChapter(hash)) {
      requestAnimationFrame(() => this._scrollTo(hash))
      return
    }

    // Not ready yet. Observe re-md once; the observer self-disconnects on
    // the first successful activation. No setTimeout, no setInterval — those
    // were the source of the "constantly firing --chapter-active" bug
    // because re-md's async inlineSvgImages kept producing childList records.
    this._cleanupChapterActivation()
    const observer = new MutationObserver(() => {
      if (this._activateChapter(hash)) {
        observer.disconnect()
        this._pendingObserver = null
        if (this._pendingSafetyTimeout) {
          clearTimeout(this._pendingSafetyTimeout)
          this._pendingSafetyTimeout = null
        }
        requestAnimationFrame(() => this._scrollTo(hash))
      }
    })
    observer.observe(this._remd, { childList: true, subtree: true })
    this._pendingObserver = observer

    // Safety net: give up after 5 s so we don't observe forever on a bad hash.
    this._pendingSafetyTimeout = setTimeout(() => {
      if (this._pendingObserver) {
        this._pendingObserver.disconnect()
        this._pendingObserver = null
      }
      this._pendingSafetyTimeout = null
    }, 5000)
  }

  _cleanupChapterActivation() {
    if (this._pendingObserver) {
      this._pendingObserver.disconnect()
      this._pendingObserver = null
    }
    if (this._pendingSafetyTimeout) {
      clearTimeout(this._pendingSafetyTimeout)
      this._pendingSafetyTimeout = null
    }
  }
}

export default docQuick
