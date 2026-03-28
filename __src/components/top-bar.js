import { html } from "/__src/js/html.js";
import svgNinja from '/__src/components/svg-ninja.js';
import { readyElement } from "/__src/components/ready-element.js";

customElements.define('svg-ninja', svgNinja);

class topBar extends readyElement {
  constructor() {
    super();
  }

  initThemeToggle() {
    const toggle = this.querySelector('#theme-mode');
    const root = document.documentElement;
    
    // Check saved preference or system preference
    const savedTheme = localStorage.getItem('theme-mode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    // Set initial state
    toggle.checked = isDark;
    if (isDark) root.setAttribute('theme-mode', 'dark');
    else root.setAttribute('theme-mode', 'light');
    
    // Listen for changes
    toggle.addEventListener('change', () => {
      const dark = toggle.checked;
      root.setAttribute('theme-mode', dark ? 'dark' : 'light');
      localStorage.setItem('theme-mode', dark ? 'dark' : 'light');
    });
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme-mode')) {
        toggle.checked = e.matches;
        root.setAttribute('theme-mode', e.matches ? 'dark' : 'light');
      }
    });
  }

  get HTML() {
    return html`
    <style>
      .top-bar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        height: var(--top-bar-height);
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: hsl(var(--fcolor-hsl));
        background-color: hsla(var(--bcolor-hsl) / 0.25);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid hsla(var(--fcolor-hsl) / 0.2);
        font-family: var(--ff-2, sans-serif);

        :where(a, a:visited) {
          color: inherit;
          text-decoration: none;
        }
      }
      .top-bar-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        height: 100%;
        padding-inline: var(--page-padding-x);
        padding-block: 0;
      }
      .top-bar-container-left {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 100%;
      }
      .top-bar-container-right {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        column-gap: var(--space-unit, 0.5rem);
        color: inherit;
      }
      .top-bar-title {
        font-family: var(--ff-1, sans-serif);
        font-size: var(--f-size-h1, 1rem);
        color: hsla(var(--fcolor-hsl, 0 0% 100%) / 1);
        cursor: pointer;
      }
      .top-bar-logo-container {
        display: flex;
        align-items: center;
        justify-content: center;
        column-gap: var(--space-unit, 0.5rem);
      }
      .top-bar-logo {
        max-width: calc(var(--space-unit, 0.5rem) * 5);
        height: calc( var(--top-bar-height) - var(--space-unit) * 1);
      }
      .top-bar-action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        column-gap: var(--space-unit, 0.5rem);
        color: inherit;
      }
      .top-bar-action-button-icon {
        width: calc(var(--space-unit, 0.5rem) * 4);
        height: calc(var(--space-unit, 0.5rem) * 4);
      }
      /* Theme Toggle Slider */
      .theme-mode {
        display: flex;
        align-items: center;
        cursor: pointer;
        height: 100%;
      }
      .theme-mode-input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }
      .theme-mode-track {
        position: relative;
        width: calc(var(--space-unit, 0.5rem) * 6);
        height: calc(var(--space-unit, 0.5rem) * 3);
        background-color: hsla(var(--fcolor-hsl) / 0.15);
        border-radius: calc(var(--space-unit, 0.5rem) * 2);
        transition: background-color 0.3s ease;
      }
      .theme-mode-thumb {
        position: absolute;
        top: 1px;
        left: 2px;
        width: calc(var(--space-unit, 0.5rem) * 2.8);
        height: calc(var(--space-unit, 0.5rem) * 2.8);
        background-color: hsl(var(--bcolor-hsl));
        border-radius: 50%;
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .theme-icon {
        width: 70%;
        height: 70%;
        color: hsl(var(--fcolor-hsl));
        transition: opacity 0.2s ease;
      }
      .theme-icon.sun { opacity: 1; }
      .theme-icon.moon { 
        position: absolute;
        opacity: 0; 
      }
      /* Checked state (dark mode) */
      .theme-mode-input:checked + .theme-mode-track {
        background-color: hsla(var(--fcolor-hsl) / 0.15);
      }
      .theme-mode-input:checked + .theme-mode-track .theme-mode-thumb {
        transform: translateX(calc(var(--space-unit, 0.5rem) * 2.8));
      }
      .theme-mode-input:checked + .theme-mode-track .sun { opacity: 0; }
      .theme-mode-input:checked + .theme-mode-track .moon { opacity: 1; }

      .top-bar-container-center {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
      }
      .top-bar-nav {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
      }
      .top-bar-nav-list {
        display: flex;
        align-items: center;
        column-gap: calc(var(--space-unit, 0.5rem) * 3);
        height: 100%;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .top-bar-nav-item {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
      }
      .top-bar-nav-item-link {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        font-size: var(--f-size-p, 0.9rem);
        font-weight: 300;
        color: hsla(var(--fcolor-hsl) / 0.8);
        text-decoration: none;
        cursor: pointer;
        transition: color 0.3s ease;
        &:hover {
          color: hsla(var(--fcolor-hsl) / 1);
        }
      }
      .top-bar-nav-item-link::after {
        content: '';
        display: block;
        width: 100%;
        height: 3px;
        position: absolute;
        bottom: 0;
      }
      .top-bar-nav-item-link.--link-active::after {
        background-color: hsl(var(--accent-color-hsl));
      }
      .top-bar-nav-item-link:not(.--link-active):hover::after {
        background-color: hsla(var(--fcolor-hsl) / 0.2);
      }
      .top-bar-logo {
        width: calc(var(--space-unit, 0.5rem) * 5);
        height: calc( var(--top-bar-height) - var(--space-unit) * 4);
      }
      .top-bar-logo-link {
        display: flex;
        align-items: center;
        justify-content: center;
        column-gap: var(--space-unit, 0.5rem);
        color: inherit;
        text-decoration: none;
      }
    </style>

    <header class="top-bar">
      <div class="top-bar-container">

        <div class="top-bar-container-left">
          <div class="top-bar-logo-container">
            <a href="/" class="top-bar-logo-link">
              <svg-ninja svg-class="top-bar-logo" svg-src="/__src/img/native-lines-logo.svg">
              </svg-ninja>
              <h1 class="top-bar-title">native<span style=" color: hsla(var(--fcolor-hsl) / 0.6);">layer.dev</span></h1>
            </a> 
          </div>
        </div>
        <div class="top-bar-container-center">
          <nav class="top-bar-nav">
            <ul class="top-bar-nav-list">
              <li class="top-bar-nav-item"><a class="top-bar-nav-item-link" href="/packages">Packages</a></li>
              <li class="top-bar-nav-item"><a class="top-bar-nav-item-link" href="/docs">Docs</a></li>
              <li class="top-bar-nav-item"><a class="top-bar-nav-item-link" href="/demos">Demos</a></li>
              <li class="top-bar-nav-item"><a class="top-bar-nav-item-link" href="/about">About</a></li>
            </ul>
          </nav>
        </div>
        <div class="top-bar-container-right">
          <label class="theme-mode">
            <input type="checkbox" class="theme-mode-input" id="theme-mode">
            <span class="theme-mode-track">
              <span class="theme-mode-thumb">
                <svg viewBox="0 0 80 80" class="theme-icon sun">
                  <circle cx="40" cy="40" r="28" fill="currentColor"/>
                </svg>
                <svg viewBox="0 0 80 80" class="theme-icon moon">
                  <path d="M33.25,12c-3.71,0-7.26.73-10.5,2.04,10.26,4.15,17.5,14.21,17.5,25.96s-7.24,21.8-17.5,25.96c3.24,1.31,6.79,2.04,10.5,2.04,15.46,0,28-12.54,28-28s-12.54-28-28-28Z" fill="currentColor"/>
                </svg>
              </span>
            </span>
          </label>
        </div>

      </div>
    </header>
    `;
  }

  connectedCallback() {
    this.innerHTML = this.HTML;
    this.initThemeToggle();
    this.setActiveNavItem();

    this._resolveReady();
  }

  // Set active state on navigation item based on current path
  setActiveNavItem() {
    const currentPath = window.location.pathname;
    const links = this.querySelectorAll('.top-bar-nav-item-link');
    
    links.forEach(link => {
      link.classList.remove('--link-active');
      const href = link.getAttribute('href');
      
      // Match exact path or path prefix (for /docs/*)
      if (currentPath === href || (href !== '/' && currentPath.startsWith(href))) {
        link.classList.add('--link-active');
      }
    });
  }
}

export default topBar;