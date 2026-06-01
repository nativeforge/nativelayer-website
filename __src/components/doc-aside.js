import { scrollToHeadingById, updateUrlHash } from '/__src/js/utils.js';

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
        padding-left: var(--page-padding-x);
        position: fixed;
        left: 0;
        top: var(--top-bar-height);
        bottom: 0;
        display: flex;
        flex-direction: column;
        width: var(--doc-aside-width);
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
        
      .doc-aside-list li.--chapter-active .doc-aside-expander,
      .doc-aside-list .nav-item.--chapter-active .doc-aside-expander {
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
        content: counter(section) ".";
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
        border-radius: calc(var(--space-unit) * 1/2);
        transition: color .32s ease, background-color .32s ease;
      }
      .doc-aside-title a {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: space-between;
        gap: calc(var(--space-unit) * 1);
        min-height: calc(var(--space-unit) * 4);
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
        padding-right: var(--page-padding-x);
        padding-top: var(--page-padding-x);
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

      doc-aside aside .doc-aside-search::placeholder {
        color: hsla(var(--fcolor-hsl) / 0.75);
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
      doc-aside aside .doc-aside-footer-logo svg-ninja {
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
            <svg-ninja svg-class="doc-aside-footer-logo-svg" svg-src="/__src/img/remd-logo.svg"></svg-ninja>
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