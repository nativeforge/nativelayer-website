class docCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._handler = (e) => this.update(e.detail);
  }

  connectedCallback() {
    this.render();
    document.addEventListener('chapter-change', this._handler);
    
    // Handle click: prevent native navigation, update hash via pushState
    this.shadowRoot.addEventListener('click', (e) => {
      const link = e.target.closest('.doc-card-link');
      if (!link) return;
      
      e.preventDefault();
      const hash = link.href.split('#')[1];
      if (!hash) return;
      
      // Update URL without triggering full route re-evaluation
      const newUrl = `${window.location.pathname}#${hash}`;
      window.history.pushState({}, '', newUrl);
      
      // Manually trigger hash change handling
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
  }

  disconnectedCallback() {
    document.removeEventListener('chapter-change', this._handler);
  }

  // "0-introduction" → "Introduction", "3-plugin-system" → "Plugin System"
  formatName(id) {
    if (!id) return '';
    return id
      .replace(/^\d+-/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  update({ index, map }) {
    if (!map || !map.length) return;

    const isPrev = this.getAttribute('data-label') === 'previous';
    const targetIndex = isPrev ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= map.length) {
      this.style.visibility = 'hidden';
      this.style.pointerEvents = 'none';
      return;
    }

    this.style.visibility = 'visible';
    this.style.pointerEvents = 'auto';

    const targetId = map[targetIndex];
    const nameEl = this.shadowRoot.querySelector('.doc-card-chapter-name');
    const linkEl = this.shadowRoot.querySelector('.doc-card-link');

    if (nameEl) nameEl.textContent = this.formatName(targetId);
    if (linkEl) linkEl.href = `#${targetId}`;
  }

  render() {
    const label = this.getAttribute('data-label') || '';

    this.shadowRoot.innerHTML = `
      <style>
      :host {
        width: 100%;
        display: flex;
        visibility: hidden;
      }
      .doc-card-link {
        display: flex;
        width: 100%;
        padding: calc(var(--space-unit) * 3);
        box-shadow: 0 0 0 1px hsla(var(--accent-color-hsl) / 0.4) inset;
        border-radius: calc(var(--space-unit) * 1);
        color: inherit;
        text-decoration: none;
        cursor: pointer;
        transition: box-shadow 0.4s ease, color .4s ease-in-out, background-color .4s ease-in-out, opacity .4s ease-in-out;
      }
      .doc-card-link:hover {
        box-shadow: 0 0 0 2px hsla(var(--accent-color-hsl) / 0.8) inset;
      }
      :host([data-label="previous"]) {
        .doc-card {
          display: flex;
          flex-direction: row-reverse;
          justify-content: flex-end;
          align-items: center;
          column-gap: calc(var(--space-unit) * 2);
          width: 100%;
        }
        .doc-card-content {
          align-items: flex-start;
        }
        .doc-card-arrow-icon {
          transform: rotate(180deg);
        }
      }
      :host([data-label="next"]) {
        .doc-card {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          column-gap: calc(var(--space-unit) * 2);
          width: 100%;
        }
        .doc-card-content {
          align-items: flex-end;
        }
        .doc-card-arrow-icon {
          transform: rotate(0deg);
        }
      }
      .doc-card-content {
        display: flex;
        flex-direction: column;
      }
      .doc-card-link:hover .doc-card-label {
        opacity: 1;
      }
      .doc-card-label {
        font-size: 0.8rem;
        font-family: var(--ff-3);
        opacity: 0.6;
        text-transform: capitalize;
        color: hsla(var(--color-accent-hsl) / 0.8);
        transition: opacity .4s ease-in-out;
      }
      .doc-card-chapter-name {
        margin: 0;
        color: hsl(var(--fcolor-hsl));
        font-family: var(--ff-2);
      }
      .doc-card-arrow {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 24px;
        height: 24px;
        color: hsl(var(--accent-color-hsl));
      }
      </style>

      <a class="doc-card-link" href="#">
        <div class="doc-card">
          <div class="doc-card-content">
            <span class="doc-card-label">${label}</span>
            <h3 class="doc-card-chapter-name"></h3>
          </div>
          <div class="doc-card-arrow">
            <svg class="doc-card-arrow-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 8l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </a>`;
  }
}

export default docCard
