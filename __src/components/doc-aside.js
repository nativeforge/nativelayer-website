import { scrollToHeadingById, updateUrlHash } from '/__src/js/utils.js';
import svgInsert from '/__src/components/svg-insert/index.js'

class docAside extends HTMLElement {
  constructor() {
    super();
    this.expanderColor = this.getAttribute('expander-color') || 'hsla(var(--fcolor-hsl, 0 0% 0%) / .6)';
  }

  static get observedAttributes() {
    return ['expander-color', 'section-numbers'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'expander-color' && oldValue !== newValue) {
      this.expanderColor = newValue || 'hsla(var(--fcolor-hsl, 0 0% 0%) / .6)';
      this.updateExpanderColor();
    }
    if (name === 'section-numbers') {
      const el = this.querySelector('.doc-aside-icon-container-numbers');
      if (el) {
        el.classList.toggle('--active');
      }
    }
  }


  updateExpanderColor() {
    // Remove any existing expander color styles
    const existingStyle = document.getElementById('doc-aside-expander-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new style element
    const style = document.createElement('style');
    style.id = 'doc-aside-expander-style';
    style.textContent = `
      doc-aside .doc-aside-expander {
        color: ${this.expanderColor} !important;
      }
    `;
    document.head.appendChild(style);
  }

  toggleAttribute(attribute) {
    if (this.hasAttribute(attribute)) {
      this.removeAttribute(attribute);
    } else {
      this.setAttribute(attribute, '');
    }
  }

  connectedCallback() {
    this.updateExpanderColor();

    this.innerHTML = `
    <style>
      doc-aside,
      doc-aside * {
        box-sizing: border-box;
      }

      doc-aside {
        font-family: var(--ff-2, sans-serif);
        padding-left: var(--page-padding-x, 1rem);
        position: fixed;
        left: 0;
        top: var(--top-bar-height, 3rem);
        bottom: 0;
        display: flex;
        flex-direction: column;
        width: var(--doc-aside-width, 16rem);
        background-color: hsla(var(--accent-color-hsl, var(--fcolor-hsl, 0 0% 0%)) / .06);
        --doc-aisde-list-item-bg-color: hsla(var(--bcolor-hsl, 0 0% 100%) / 0.4);

        color: hsl(var(--fcolor-hsl, 0 0% 0%));
        font-weight: var(--fw-2, 300);
      }

      @media (width < 60rem) {
        doc-aside {
          display: none;
        }
      }

      .doc-aside-list li {
        width: 100%;
      }

      doc-aside .doc-aside-list a {
        line-height: 1.8;
        hyphens: auto;
        overflow-wrap: normal;
        word-break: normal;
        color: inherit;
      }
      
      doc-aside aside li {
        color: hsla(var(--bcolor-hsl, 0 0% 100%) / .8);
      }

      /* Custom expander styling - top level */
      doc-aside .doc-aside-expander {
        display: inline-block;
        font-size: var(--f-size-p);
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / .4);
        padding: calc(var(--space-unit, 0.5rem) * 1);
        margin: calc(var(--space-unit, 0.5rem) * -1) calc(var(--space-unit, 0.5rem) * -1) calc(var(--space-unit, 0.5rem) * -1) 0;
        transition: transform 0.2s ease;
        cursor: pointer;
      }
        
      .--chapter-active > .nav-item > .doc-aside-expander, .nav-item.--chapter-active > .doc-aside-expander {
        color: hsl(var(--over-accent-color-hsl, 0 0% 0%)) !important;
      }

      /* Rotate expander when item is open */
      doc-aside .doc-aside-list li[open] > .nav-item .doc-aside-expander {
        transform: rotate(90deg);
      }

      /* Section numbering - only show when attribute is present */
      doc-aside .doc-aside-list,
      doc-aside .doc-aside-list ol {
        list-style: none;
        counter-reset: section;
      }

      doc-aside .doc-aside-list li {
        counter-increment: section;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: baseline;
      }

      doc-aside .doc-aside-list li::before {
        content: '';
        display: inline-flex;
        align-items: baseline;
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / .25);
        flex-shrink: 0;
      }
      doc-aside .doc-aside-list > li {
        padding-left: 0;
      }
      doc-aside .doc-aside-list li > .nav-item {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: calc(var(--space-unit, 0.5rem) * 2);
        background-color: var(--doc-aisde-list-item-bg-color);
        border-radius: calc(var(--space-unit, 0.5rem) * 1/2);
        padding: calc(var(--space-unit, 0.5rem) * 0.5) calc(var(--space-unit, 0.5rem) * 1);
        flex: 1;
        min-width: 0;
        cursor: pointer;
      }
      doc-aside .doc-aside-list li > .nav-item > a {
        flex: 1;
        min-width: 0;
      }
      doc-aside .doc-aside-list ol li::before {
        margin-right: calc(var(--space-unit, 0.5rem) * var(--doc-aside-indent-width, 2));
      }

      doc-aside[section-numbers] .doc-aside-list li::before {
        content: attr(data-counter) ".";
        margin-right: calc(var(--space-unit, 0.5rem) * 1);
      }

      doc-aside[section-numbers] .doc-aside-list {
        padding-left: calc(var(--space-unit, 0.5rem) * 0);
      }

      .--accent-is-light doc-aside .doc-aside-title:hover > a {
        color: hsl(var(--over-accent-color-hsl));
      }

      .doc-aside-title {
        display: flex;
        color: hsla(var(--fcolor-hsl) / .8);
        border-radius: calc(var(--space-unit, 0.5rem) * 1/2);
        transition: color .32s ease, background-color .32s ease;
      }
      .doc-aside-title a {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: space-between;
        gap: calc(var(--space-unit, 0.5rem) * 1);
        min-height: calc(var(--space-unit, 0.5rem) * 4);
        width: 100%;
        padding: calc(var(--space-unit, 0.5rem) * 0.5) calc(var(--space-unit, 0.5rem) * 1);
      }

      .doc-aside-title.--chapter-active{
        color: hsl(var(--over-accent-color-hsl, 0 100% 100%));
        background-color: hsla(var(--accent-color-hsl, 210 100% 50%) / 1);
        border-radius: calc(var(--space-unit, 0.5rem) * 1/2);
        transition: color 0.4s ease, background-color 0.4s ease;
      }
      .doc-aside-title:hover {
        color: hsl(var(--over-accent-color-hsl, 0 100% 100%));
        background-color: hsla(var(--accent-color-hsl) / 1);
        transition: color 0.32s ease, background-color 0.32s ease;
      }
      .doc-aside-title.--chapter-active > a{
        color: hsl(var(--over-accent-color-hsl));
      }

      .doc-aside-list li.--chapter-active > .nav-item,
      .doc-aside-list .nav-item.--chapter-active {
        color: hsl(var(--over-accent-color-hsl, 0 100% 100%));
        background-color: hsla(var(--accent-color-hsl, 210 100% 50%) / 1);
      }

      ol.doc-aside-list {
        padding-left: calc(var(--space-unit, 0.5rem) * 0);
        border-radius: calc(var(--space-unit, 0.5rem) * 1);
      }

      /* Custom scrollbar for webkit browsers */
      doc-aside aside .doc-aside-content::-webkit-scrollbar {
        width: 4px;
      }

      doc-aside aside .doc-aside-content::-webkit-scrollbar-track {
        background: transparent;
      }

      doc-aside aside .doc-aside-content::-webkit-scrollbar-thumb {
        background: hsla(var(--fcolor-hsl, 0 0% 0%) / .25);
        border-radius: 2px;
      }

      doc-aside aside .doc-aside-content::-webkit-scrollbar-thumb:hover {
        background: hsla(var(--fcolor-hsl, 0 0% 0%) / .5);
      }

      doc-aside aside {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        width: 100%;
        padding-right: var(--page-padding-x, 1rem);
        padding-top: var(--page-padding-x, 1rem);
        overflow: hidden;
        scrollbar-width: thin;
        scrollbar-color: hsla(var(--fcolor-hsl, 0 0% 0%) / .3) transparent;
        border-right: 1px solid hsla(var(--accent-color-hsl, var(--fcolor-hsl)) / var(--aside-border-opacity, 0.4));
      }

      doc-aside aside li,
      doc-aside aside :where(a, a:visited) {
        font-size: var(--f-size-p);
        font-family: var(--ff-2);
        text-decoration: none;
        color: hsla(var(--fcolor-hsl) / 1);
      }

      doc-aside aside .doc-aside-title {
        font-size: var(--f-size-p);
        line-height: 1.4;
        margin: 0;
      }

      doc-aside aside .doc-aside-title a {
        text-decoration: none;
        color: inherit;
      }

      doc-aside aside .doc-aside-search {
        width: 100%;
        background-color: hsla(var(--bcolor-hsl) / 0.9);
        height: calc(var(--space-unit, 0.5rem) * 4);
        margin: calc(var(--space-unit, 0.5rem) * 2) 0;
        padding: calc(var(--space-unit, 0.5rem) * 1) calc(var(--space-unit, 0.5rem) * 1);
        border: none;
        border-radius: calc(var(--space-unit, 0.5rem) * 0.5);
        transition: box-shadow 0.4s ease;
      }

      doc-aside aside .doc-aside-search:focus,
      doc-aside aside .doc-aside-search:active {
        outline: 0;
        box-shadow: 0 0 0 1px hsla(var(--accent-color-hsl, 340 100% 50%) / .8) inset;
      }

      doc-aside aside .doc-aside-search:not(:placeholder-shown) {
        animation: search-input-pulse 1s ease-in-out infinite;
      }

      @keyframes search-input-pulse {
        0%, 100% { box-shadow: 0 0 0 2px hsl(var(--accent-color-hsl, 340 100% 50%) / 0.8) inset; }
        50%       { box-shadow: 0 0 0 1px hsl(var(--accent-color-hsl, 340 100% 50%) / 0.25) inset; }
      }

      doc-aside aside .doc-aside-search::-webkit-search-cancel-button {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        cursor: pointer;
        background-color: hsl(var(--accent-color-hsl, 340 100% 50%));
        -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'%3E%3Cline x1='2' y1='2' x2='12' y2='12' stroke='black' stroke-width='2.5' stroke-linecap='round'/%3E%3Cline x1='12' y1='2' x2='2' y2='12' stroke='black' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat center / contain;
        mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'%3E%3Cline x1='2' y1='2' x2='12' y2='12' stroke='black' stroke-width='2.5' stroke-linecap='round'/%3E%3Cline x1='12' y1='2' x2='2' y2='12' stroke='black' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat center / contain;
      }

      doc-aside aside .doc-aside-search::placeholder {
        color: hsla(var(--fcolor-hsl) / 0.75);
      }

      .doc-aside-list li.--search-hidden { display: none; }

      mark.search-mark {
        background: hsl(var(--accent-color-hsl) / 0.25);
        color: inherit;
        border-radius: 2px;
      }

      .search-heading-hit {
        display: inline-block;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: hsl(var(--accent-color-hsl));
        margin-left: 0.6em;
        vertical-align: middle;
        animation: search-pulse 1s ease-in-out infinite;
      }

      @keyframes search-pulse {
        0%, 100% { opacity: 1;   transform: scale(1);   }
        50%       { opacity: 0.4; transform: scale(0.65); }
      }

      doc-aside aside hr.doc-aside-separator-header {
        width: 100%;
        border-left: none;
        border-right: none;
        border-top: none;
        border-bottom: 1px solid hsla(var(--accent-color-hsl, 0 0% 0%) / .4);
        margin: calc(var(--space-unit, 0.5rem) * 2) 0 0 0;
        padding-block-end: 0;
      }

      doc-aside aside hr.doc-aside-separator-footer {
        width: 100%;
        border-left: none;
        border-right: none;
        border-top: none;
        border-bottom: 1px solid hsla(var(--accent-color-hsl, 0 0% 0%) / .4);
        padding: 0;
        margin: 0;
        margin-bottom: calc(var(--space-unit, 0.5rem) * 1);
      }

      doc-aside aside .doc-aside-header,
      doc-aside aside .doc-aside-content,
      doc-aside aside .doc-aside-footer {
        display: flex;
        flex-direction: column;
      }

      doc-aside aside .doc-aside-header {
        flex-shrink: 0;
      }

      doc-aside aside .doc-aside-footer {
        flex-shrink: 0;
        padding: 0 0 calc(var(--space-unit, 0.5rem) * 2.5) 0;
        font-size: var(--f-size-p);
        line-height: 1.42;
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / .6);
      }

      doc-aside aside .doc-aside-content {
        flex: 1;
        min-height: 0;
        padding-top: calc(var(--space-unit, 0.5rem) * 3);
        padding-bottom: calc(var(--space-unit, 0.5rem) * 8);
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
      }

      doc-aside aside :where(.doc-aside-head, .doc-aside-icons) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: calc(var(--space-unit, 0.5rem) * 1);
      }

      doc-aside aside .doc-aside-head {
        justify-content: space-between;
      }

      doc-aside aside .doc-aside-logo {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: calc(var(--space-unit, 0.5rem) * 1);
      }

      doc-aside aside .doc-aside-logo-svg {
        width: calc(var(--space-unit, 0.5rem) * 4);
        height: calc(var(--space-unit, 0.5rem) * 4);
      }

      doc-aside aside :where(.doc-aside-icon) {
        width: calc(var(--space-unit, 0.5rem) * 3);
        height: calc(var(--space-unit, 0.5rem) * 3);
      }

      doc-aside aside .doc-aside-list {
        position: sticky;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: calc(var(--space-unit, 0.5rem) * 1);
        scrollbar-width: 4px;
        scrollbar-color: hsla(var(--accent-color-hsl, 348 100% 50%) / .8) transparent;
        overscroll-behavior: contain;
      }

      doc-aside aside .doc-aside-list::-webkit-scrollbar {
        width: 4px;
      }

      doc-aside aside .doc-aside-list::-webkit-scrollbar-track {
        background: transparent;
      }

      doc-aside aside .doc-aside-list::-webkit-scrollbar-thumb {
        background: hsla(var(--accent-color-hsl, 348 100% 50%) / .2);
        border-radius: 2px;
        width: 4px;
      }

      doc-aside aside .doc-aside-list::-webkit-scrollbar-thumb:hover {
        background: hsla(var(--accent-color-hsl, 348 100% 50%) / .2);
      }

      doc-aside aside ol {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      doc-aside .doc-aside-list li > ol {
        display: none;
      }

      doc-aside .doc-aside-list li[open] > ol {
        display: flex;
        flex-direction: column;
        flex-basis: 100%;
        row-gap: calc(var(--space-unit, 0.5rem) * 1);
        padding-top: calc(var(--space-unit, 0.5rem) * 1);
      }

      doc-aside aside ol > li {
        list-style-type: none !important;
        padding: 0;
        padding-inline-start: calc(var(--space-unit, 0.5rem) * 2);
        margin: 0;
      }

      doc-aside aside,
      doc-aside aside * {
        color: hsl(var(--fcolor-hsl, 0 0% 0%));
      }

      doc-aside aside a {
        text-decoration: none;
        color: inherit;
        display: block;
        width: 100%;
      }

      doc-aside aside .nav-item {
        display: flex;
        align-items: center;
        width: 100%;
      }

      doc-aside aside .doc-aside-footer .doc-aside-footer-link {
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / .6);
        text-decoration: underline dotted;
        text-underline-offset: 4px;
        text-decoration-thickness: 1px;
        text-decoration-color: hsla(var(--fcolor-hsl, 0 0% 0%) / .6);
        text-decoration-style: dotted;
      }

      doc-aside aside .doc-aside-icons {
        display: flex;
        align-items: center;
        gap: calc(var(--space-unit, 0.5rem) * 1);
      }

      doc-aside aside :where([class^="doc-aside-icon-container-"], .doc-aside-icon-container) {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: calc(var(--space-unit, 0.5rem) * 3/4);
        height: calc(var(--space-unit, 0.5rem) * 4);
        width: calc(var(--space-unit, 0.5rem) * 4);
        cursor: pointer;
        transition: background-color 0.4s ease;
        box-shadow: 0 0 0 1px hsla(var(--fcolor-hsl, 0 0% 0%) / .2) inset;
        background-color: hsla(var(--bcolor-hsl, 0 0% 100%) / .1);
        border-radius: calc(var(--space-unit, 0.5rem) * 0.5);
      }

      doc-aside aside :where([class^="doc-aside-icon-container-"], .doc-aside-icon-container):hover {
        background-color: hsla(var(--accent-color-hsl, 340 100% 50%) / .1);
      }

      doc-aside aside :where([class^="doc-aside-icon-container-"], .doc-aside-icon-container).--active {
        box-shadow: 0 0 0 0 transparent inset;
        background-color: hsla(var(--accent-color-hsl, 340 100% 50%) / .8);
        color: hsl(var(--over-accent-color-hsl));
      }

      /* Beat doc-aside aside * { color: ... } so icons (svg/use) pick up over-accent in all browsers */
      doc-aside aside :where([class^="doc-aside-icon-container-"], .doc-aside-icon-container).--active * {
        color: hsl(var(--over-accent-color-hsl));
      }

      doc-aside aside .doc-aside-footer-row {
        display: inline-flex;
        align-items: center;
        justify-content: start;
        gap: calc(var(--space-unit, 0.5rem) * 1);
      }

      doc-aside aside .doc-aside-footer-logo {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-unit, 0.5rem) * 4);
        height: calc(var(--space-unit, 0.5rem) * 4);
      }

      doc-aside aside .doc-aside-footer-logo svg,
      doc-aside aside .doc-aside-footer-logo svg-insert {
        display: block;
        width: 100%;
        height: 100%;
      }

      html {
        scroll-behavior: smooth;
      }

      :root :where(h1, h2, h3, h4, h5, h6) {
        scroll-margin-top: calc(var(--top-bar-height, calc(var(--space-unit, 0.5rem) * 4)) + var(--space-unit, 0.5rem) * 3) !important;
      }
    </style>

    <aside>
      <div class="doc-aside-header">

        <div class="doc-aside-head">

          <input type="search" class="doc-aside-search" placeholder="Search" />

          <div class="doc-aside-icons">

            <div class="doc-aside-icon-container-expand">
              <svg class="doc-aside-icon">
                <use href="../__src/img/sprite.svg#icon-expand"></use>
              </svg>
            </div>

            <div class="doc-aside-icon-container-fold">
              <svg class="doc-aside-icon">
                <use href="../__src/img/sprite.svg#icon-fold"></use>
              </svg>
            </div>

            <div class="doc-aside-icon-container-numbers --active">
              <svg class="doc-aside-icon">
                <use href="../__src/img/sprite.svg#icon-numbers"></use>
              </svg>
            </div>

          </div>

        </div>

        <h1 class="doc-aside-title"></h1>

        <hr class="doc-aside-separator-header"/>
      </div>
      
      <div class="doc-aside-content">
        <ol class="doc-aside-list">
        </ol>
      </div>

      <div class="doc-aside-footer">
        <hr class="doc-aside-separator-footer"/>
        <div class="doc-aside-footer-row">
          Powered by 
          <span class="doc-aside-footer-logo">
            <svg-insert class="doc-aside-footer-logo-svg" src="/__src/img/remd-logo.svg"></svg-insert>
          </span> <strong>re-md</strong> <br/>
        </div>
        
      </div>
    </aside>
    `
    
    // Initialize the aside functionality
    this.structureAside();

    // Toggle section numbers when clicked
    const numbersIcon = this.querySelector('.doc-aside-icon-container-numbers');
    if (numbersIcon) {
      numbersIcon.addEventListener('click', () => {
          this.toggleAttribute('section-numbers');
      });
    }

    // expand all items with children
    const expandIcon = this.querySelector('.doc-aside-icon-container-expand');
    if (expandIcon) {
      expandIcon.addEventListener('click', () => {
        this.querySelectorAll('.doc-aside-list li:has(> ol)').forEach(li => {
          li.setAttribute('open', '');
        });
      });
    }

    // fold all items with children
    const foldIcon = this.querySelector('.doc-aside-icon-container-fold');
    if (foldIcon) {
      foldIcon.addEventListener('click', () => {
        this.querySelectorAll('.doc-aside-list li:has(> ol)').forEach(li => {
          li.removeAttribute('open');
        });
      });
    }

    // search
    const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Returns a Set of heading elements in doc-body whose section contains the query.
    // Used both for placing dots and for keeping matching nav items visible.
    const computeBodyHits = (query) => {
      const hitHeadings = new Set()
      if (!query) return hitHeadings
      const content = document.querySelector('re-md div[ref="re-md-content"]')
      if (!content) return hitHeadings

      // Walk all block elements in document order, tracking the closest heading
      // above each match so dots land on the exact heading level (h2-h6) nearest
      // to the matched text, not just the section's top-level h2.
      // textContent of each element includes ALL descendant text, so blockquote/table
      // entries naturally cover their full nested content.
      const allEls = content.querySelectorAll(
        'h2, h3, h4, h5, h6,' +
        'p, pre, code, code-block, blockquote, span,' +
        'ul, ol, li, dl, dt, dd,' +
        'table, td, th, caption,' +
        'figure, figcaption, details, summary'
      )
      let currentHeading = null

      allEls.forEach(el => {
        if (/^H[2-6]$/.test(el.tagName)) {
          currentHeading = el
          if (el.textContent.toLowerCase().includes(query)) hitHeadings.add(el)
        } else if (currentHeading && el.textContent.toLowerCase().includes(query)) {
          hitHeadings.add(currentHeading)
        }
      })

      // Fallback: any section whose full textContent matches but whose heading
      // was not yet marked (e.g. content inside custom elements not in the selector above)
      content.querySelectorAll('section').forEach(section => {
        if (!section.textContent.toLowerCase().includes(query)) return
        const alreadyCovered = Array.from(hitHeadings).some(h => section.contains(h))
        if (!alreadyCovered) {
          const firstHeading = section.querySelector('h2, h3, h4, h5, h6')
          if (firstHeading) hitHeadings.add(firstHeading)
        }
      })

      return hitHeadings
    }

    const markHitsInBody = (query) => {
      document.querySelectorAll('.search-heading-hit').forEach(el => el.remove())
      const hitHeadings = computeBodyHits(query)
      hitHeadings.forEach(heading => {
        const dot = document.createElement('span')
        dot.className = 'search-heading-hit'
        heading.appendChild(dot)
      })
      return hitHeadings
    }

    const searchInput = this.querySelector('.doc-aside-search')
    let savedOpenState = new Map()

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase()
        const navList = this.querySelector('.doc-aside-list')
        if (!navList) return

        const cards = document.querySelector('.doc-quick-cards')

        if (!query) {
          navList.querySelectorAll('.--search-hidden').forEach(el => el.classList.remove('--search-hidden'))
          savedOpenState.forEach((wasOpen, li) => {
            wasOpen ? li.setAttribute('open', '') : li.removeAttribute('open')
          })
          savedOpenState.clear()
          navList.querySelectorAll('a[data-original-text]').forEach(anchor => {
            anchor.textContent = anchor.dataset.originalText
            delete anchor.dataset.originalText
          })
          if (cards) cards.style.display = ''
          markHitsInBody('')
          return
        }

        if (cards) cards.style.display = 'none'

        if (savedOpenState.size === 0) {
          navList.querySelectorAll('li:has(> ol)').forEach(li => {
            savedOpenState.set(li, li.hasAttribute('open'))
          })
        }

        // Compute body hits first so nav filtering can keep their items visible
        const bodyHitIds = new Set(
          Array.from(markHitsInBody(query))
            .map(h => h.id)
            .filter(Boolean)
        )

        navList.querySelectorAll('li').forEach(li => li.classList.add('--search-hidden'))
        navList.querySelectorAll('a').forEach(anchor => {
          if (anchor.dataset.originalText) anchor.textContent = anchor.dataset.originalText
          else anchor.dataset.originalText = anchor.textContent

          const hrefId = (anchor.getAttribute('href') || '').slice(1)
          const textMatches = anchor.textContent.toLowerCase().includes(query)
          const bodyMatches = bodyHitIds.has(hrefId)

          if (textMatches || bodyMatches) {
            let el = anchor.closest('li')
            while (el && navList.contains(el)) {
              el.classList.remove('--search-hidden')
              el.setAttribute('open', '')
              el = el.parentElement?.closest('li')
            }
            // Only highlight anchor text when the match is in the anchor itself
            if (textMatches) {
              const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
              anchor.innerHTML = anchor.dataset.originalText.replace(regex, '<mark class="search-mark">$1</mark>')
            }
          }
        })
      })
    }

  }
  
  structureAside() {
    // Build a flat navigation list from headings in doc-body
    const buildNavigation = (docBodyElement) => {
      const navList = this.querySelector('ol');
      const titleElement = this.querySelector('.doc-aside-title');
      if (!navList) return;

      // Extract H1 for the title
      const h1 = docBodyElement.querySelector('h1');
      if (h1 && titleElement) {
        // Ensure h1 has an id
        if (!h1.id) {
          h1.id = h1.textContent.trim().toLowerCase().replace(/\s+/g, '-');
        }
        
        // Plain anchor; <doc-quick>'s delegated click listener handles
        // preventDefault + URL update + chapter activation.
        const titleAnchor = document.createElement('a');
        titleAnchor.href = '#0-introduction';
        titleAnchor.textContent = h1.textContent;

        titleElement.innerHTML = '';
        titleElement.appendChild(titleAnchor);
      }

      // Get only h2-h6 for the navigation tree
      const headings = docBodyElement.querySelectorAll('h2, h3, h4, h5, h6');
      navList.innerHTML = '';
      
      // Build chapterMap from h2 headings (starting with 0-introduction)
      const h2Headings = docBodyElement.querySelectorAll('h2');
      const chapterMap = ['0-introduction'];
      h2Headings.forEach(h2 => {
        if (h2.id) {
          chapterMap.push(h2.id);
        }
      });
      
      // Set chapterMap and chapterIndex on doc-body element
      docBodyElement.chapterMap = chapterMap;
      docBodyElement.chapterIndex = 0; // Default to first chapter
      
      // Update chapterIndex based on current active section
      const remdElement = document.querySelector('re-md');
      if (remdElement) {
        const activeSection = remdElement.querySelector('section.--chapter-active');
        if (activeSection) {
          const activeRef = activeSection.getAttribute('ref');
          const index = chapterMap.indexOf(activeRef);
          if (index !== -1) {
            docBodyElement.chapterIndex = index;
          }
        }
      }
      
      this.buildHierarchicalNav(headings, navList);

      // Stamp each li with its permanent 1-based position so counter display
      // stays accurate when search filtering hides sibling items.
      const assignCounters = (list) => {
        Array.from(list.querySelectorAll(':scope > li')).forEach((li, idx) => {
          li.dataset.counter = String(idx + 1)
          const subList = li.querySelector(':scope > ol')
          if (subList) assignCounters(subList)
        })
      }
      assignCounters(navList)
    };

    this.buildHierarchicalNav = (headings, container) => {
      const headingArray = Array.from(headings);
      let i = 0;

      const processHeadings = (parentContainer, maxLevel = 6) => {
        while (i < headingArray.length) {
          const heading = headingArray[i];
          
          // Ensure heading has an id
          if (!heading.id) {
            heading.id = heading.textContent.trim().toLowerCase().replace(/\s+/g, '-');
          }

          const level = parseInt(heading.tagName.substring(1));
          
          // If this heading is at a higher level than we're processing, return
          if (level <= maxLevel) {
            return;
          }

          // Check if heading has children
          let hasChildren = false;
          for (let j = i + 1; j < headingArray.length; j++) {
            const nextLevel = parseInt(headingArray[j].tagName.substring(1));
            if (nextLevel > level) {
              hasChildren = true;
              break;
            } else if (nextLevel <= level) {
              break;
            }
          }

          const li = document.createElement('li');

          if (hasChildren) {
            const navItem = document.createElement('div');
            navItem.className = 'nav-item';

            const anchor = document.createElement('a');
            anchor.href = '#' + heading.id;
            anchor.textContent = heading.textContent;

            const expander = document.createElement('span');
            expander.className = 'doc-aside-expander';
            expander.textContent = '▶';
            expander.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              li.toggleAttribute('open');
            });

            navItem.appendChild(anchor);
            navItem.appendChild(expander);

            const childList = document.createElement('ol');
            li.appendChild(navItem);
            li.appendChild(childList);
            parentContainer.appendChild(li);

            i++; // Move to next heading

            // Process children
            processHeadings(childList, level);
          } else {
            // Simple item without children
            const anchor = document.createElement('a');
            anchor.href = '#' + heading.id;
            anchor.textContent = heading.textContent;

            const navItem = document.createElement('div');
            navItem.className = 'nav-item';
            navItem.appendChild(anchor);
            
            li.appendChild(navItem);
            parentContainer.appendChild(li);
            
            i++; // Move to next heading
          }
        }
      };

      processHeadings(container, 1);
    };

    // Smooth scroll to heading method (uses shared utility)
    this.scrollToHeading = (headingId) => {
      updateUrlHash(headingId);
      scrollToHeadingById(headingId);
    };

    // Activate nav item based on heading ID (for chapter-mode)
    this.activateNavItem = (headingId) => {
      const navList = this.querySelector('.doc-aside-list');
      if (!navList) return;

      // Remove --chapter-active from all nav items and title
      navList.querySelectorAll('.--chapter-active').forEach(el => {
        el.classList.remove('--chapter-active');
      });
      const titleElement = this.querySelector('.doc-aside-title');
      if (titleElement) {
        titleElement.classList.remove('--chapter-active');
      }

      // Special case for 0-introduction (title)
      if (headingId === '0-introduction') {
        if (titleElement) {
          titleElement.classList.add('--chapter-active');
        }
        return;
      }

      // Find the anchor with matching href
      const anchor = navList.querySelector(`a[href="#${headingId}"]`);
      if (!anchor) return;

      // Determine the heading level from the content structure
      const headingElement = document.getElementById(headingId);
      const isH2 = headingElement && headingElement.tagName === 'H2';

      if (isH2) {
        // For h2: activate the parent li
        const li = anchor.closest('.doc-aside-list > li');
        if (li) li.classList.add('--chapter-active');
      } else {
        // For h3-h6: activate the .nav-item and open its parent li so it's visible
        const navItem = anchor.closest('.nav-item');
        if (navItem) {
          navItem.classList.add('--chapter-active');
          const parentLi = navItem.closest('li');
          if (parentLi) parentLi.setAttribute('open', '');
        }
      }
    };

    // Function to wait for re-md content to be processed
    const waitForRemdContent = async () => {
      const docBody = document.querySelector('doc-body');
      if (!docBody) return;

      // Wait for re-md elements to be processed
      const remdElements = docBody.querySelectorAll('re-md');
      if (remdElements.length > 0) {
        // Create a promise that resolves when all re-md elements are processed
        await new Promise(resolve => {
          const observer = new MutationObserver((mutations) => {
            // Check if re-md elements have been processed (they'll have content)
            const allProcessed = Array.from(remdElements).every(el => el.children.length > 0);
            if (allProcessed) {
              observer.disconnect();
              resolve();
            }
          });

          // Observe changes in re-md elements
          remdElements.forEach(el => {
            observer.observe(el, {
              childList: true,
              subtree: true
            });
          });
        });
      }

      // Now build the navigation
      buildNavigation(docBody);

      // Re-activate the current chapter if doc-quick already marked one
      // before this nav was built (race condition on page reload)
      const remdEl = docBody.querySelector('re-md');
      if (remdEl) {
        const activeSection = remdEl.querySelector('section.--chapter-active');
        if (activeSection) {
          const ref = activeSection.getAttribute('ref');
          if (ref) this.activateNavItem(ref);
        }
      }
      // this._resolveReady();
    };

    // Listen for both events
    document.addEventListener('doc-body-ready', () => {
      waitForRemdContent();
    });

    document.addEventListener('DOMContentLoaded', () => {
      waitForRemdContent();
    });
  }
}

export default docAside