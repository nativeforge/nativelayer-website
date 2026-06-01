// class docBody extends readyElement {
class docBody extends HTMLElement {
  constructor() {
    super();
    this._chapterIndex = -1;
    this._chapterMap = [];
    this.injectStyles();
  }

  get chapterIndex() { return this._chapterIndex; }
  set chapterIndex(value) {
    this._chapterIndex = value;
    this.dispatchEvent(new CustomEvent('chapter-change', {
      bubbles: true,
      composed: true,
      detail: { index: value, map: this._chapterMap }
    }));
  }

  get chapterMap() { return this._chapterMap; }
  set chapterMap(value) { this._chapterMap = value; }
  

  connectedCallback() {
    requestAnimationFrame(() => {
      this.dispatchEvent(new CustomEvent('doc-body-ready', {
        bubbles:  true,
        composed: true,
        detail:   { docBody: this },
      }))
    })
    // this._resolveReady()
  }

  // Inject all styles into document head
  injectStyles() {
    if (document.getElementById('doc-body-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'doc-body-styles';
    style.textContent = `
      doc-body ::where(ul, ol) {
        list-style: inside !important;
      }

      doc-body h1,
      doc-body h2,
      doc-body h3,
      doc-body h4,
      doc-body h5,
      doc-body h6 {
        position: relative;
        cursor: pointer;
      }

      doc-body h1::after,
      doc-body h2::after,
      doc-body h3::after,
      doc-body h4::after,
      doc-body h5::after,
      doc-body h6::after {
        content: var(--link-icon, "#");
        display: inline-block;
        margin-left: 8px;
        opacity: 0;
        cursor: pointer;
        transition: opacity 0.4s ease;
        vertical-align: middle;
      }

      doc-body h1:hover::after,
      doc-body h2:hover::after,
      doc-body h3:hover::after,
      doc-body h4:hover::after,
      doc-body h5:hover::after,
      doc-body h6:hover::after {
        opacity: var(--link-icon-opacity, 0.4);
      }

      doc-body h1.copied::after,
      doc-body h2.copied::after,
      doc-body h3.copied::after,
      doc-body h4.copied::after,
      doc-body h5.copied::after,
      doc-body h6.copied::after {
        content: var(--link-icon-copied, "# copied!");
        opacity: var(--link-icon-opacity, 0.4);
      }

      doc-body {
        position: relative;
        top: calc( var(--space-unit) * 4);
        left: var(--doc-aside-width);
        min-height: calc(100dvh - var(--top-bar-height) - var(--space-unit) * 4);
        padding-left: var(--page-padding-x);
        /* padding-right: var(--page-padding-x); */
        
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--fcolor, 0.8));
        padding-bottom: calc(var(--space-unit, 0.5rem) * 16);
        display: flex;
        flex-direction: column;
        width: calc(100% - var(--doc-aside-width) - var(--page-padding-x, 1rem) * 1);
        max-width: 60rem;
        row-gap: calc(var(--space-unit, 0.5rem) * 3);
        line-height: 1.6;
        counter-reset: h2;
      }

      [theme-mode="dark"].--accent-is-dark doc-body {
        --accent-color-hsl: var(--accent-color-hsl-adjusted-soft);
      }

      doc-body > re-md {
        flex: 1 1 auto;
        min-height: 0;
      }

      doc-body:has(> .doc-quick-cards) {
        padding-bottom: calc(var(--space-unit) * 4);
      }

      @media (width < 60rem) {
        doc-body {
          left: 0;
          width: calc(100% - var(--page-padding-x, 1rem) * 1);
        }
      }

      doc-body a {
        text-decoration: underline;
        text-decoration-style: dotted;
        text-decoration-thickness: 1px;
        text-underline-offset: 4px;
        text-decoration-color: hsla(var(--link-color-hsl, var(--fcolor-hsl, 0 0% 0%)) / var(--link-underline-opacity, 0.8));
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--link-color-opacity, 0.8));
        &::after {
          content: "🔗";
          display: inline-block;
          margin-left: calc(var(--space-unit) * 0.5);
          cursor: pointer;
          vertical-align: middle;
        }
      }

      doc-body svg {
        width: 6rem;
        height: auto;
      }

      doc-body :where(h1, h2, h3, h4, h5, h6) {
        scroll-margin-top: calc( var(--top-bar-height, calc(var(--space-unit, 0.5rem) * 2) ) + calc(var(--space-unit, 0.5rem) * 1) );
        scroll-margin-left: calc(var(--doc-aside-width) + calc(var(--space-unit) * 3));
      }

      doc-body :where(h1) { margin-top: calc(var(--space-unit, 0.5rem) * 8); }
      doc-body :where(h2) { margin-top: calc(var(--space-unit, 0.5rem) * 6); }
      doc-body :where(h3) { margin-top: calc(var(--space-unit, 0.5rem) * 4); }
      doc-body :where(h4) { margin-top: calc(var(--space-unit, 0.5rem) * 3); }
      doc-body :where(h5) { margin-top: calc(var(--space-unit, 0.5rem) * 2); }
      doc-body :where(h6) { margin-top: calc(var(--space-unit, 0.5rem) * 1); }

      doc-body re-md h1 {
        counter-reset: h2;
      }

      doc-body re-md h2 {
        counter-reset: h3;
        counter-increment: h2;
      }

      doc-body re-md h2::before {
        content: counter(h2) ". ";
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--number-opacity, 0.25));
        margin-right: var(--space-unit, 0.5rem);
      }

      doc-body re-md h3 {
        counter-reset: h4;
        counter-increment: h3;
      }

      doc-body re-md h3::before {
        content: counter(h2) "." counter(h3) " ";
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--number-opacity, 0.25));
        margin-right: var(--space-unit, 0.5rem);
      }

      doc-body re-md h4 {
        counter-reset: h5;
        counter-increment: h4;
      }

      doc-body re-md h4::before {
        content: counter(h2) "." counter(h3) "." counter(h4) " ";
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--number-opacity, 0.25));
        margin-right: var(--space-unit, 0.5rem);
      }

      doc-body re-md h5 {
        counter-reset: h6;
        counter-increment: h5;
      }

      doc-body re-md h5::before {
        content: counter(h2) "." counter(h3) "." counter(h4) "." counter(h5) " ";
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--number-opacity, 0.25));
        margin-right: var(--space-unit, 0.5rem);
      }

      doc-body re-md h6 {
        counter-increment: h6;
      }

      doc-body re-md h6::before {
        content: counter(h2) "." counter(h3) "." counter(h4) "." counter(h5) "." counter(h6) " ";
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--number-opacity, 0.25));
        margin-right: var(--space-unit, 0.5rem);
      }

      /* Chapter-mode: counters work across sections */
      doc-body re-md[chapter-mode] {
        counter-reset: h2 !important;
      }

      doc-body re-md[chapter-mode] h2 {
        counter-reset: h3 !important;
        counter-increment: h2 !important;
      }

      doc-body re-md[chapter-mode] h3 {
        counter-reset: h4 !important;
        counter-increment: h3 !important;
      }

      doc-body re-md[chapter-mode] h4 {
        counter-reset: h5 !important;
        counter-increment: h4 !important;
      }

      doc-body re-md[chapter-mode] h5 {
        counter-reset: h6 !important;
        counter-increment: h5 !important;
      }

      doc-body re-md[chapter-mode] h6 {
        counter-increment: h6 !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Copy URL to clipboard with user feedback.
  // Called by <doc-quick>'s delegated click handler when a heading is clicked.
  async copyToClipboard(url, heading) {
    // console.log('copyToClipboard called with:', url);
    
    try {
      await navigator.clipboard.writeText(url);
      // console.log('Clipboard write successful');
      
      // Show 'copied' feedback via CSS class
      heading.classList.add('copied');
      // console.log('Added copied class to:', heading.textContent);
      
      // Remove feedback after 3 seconds
      setTimeout(() => {
        heading.classList.remove('copied');
        // console.log('Removed copied class');
      }, 3000);
      
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      
      // Try alternative clipboard method for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Show success feedback
        heading.classList.add('copied');
        setTimeout(() => {
          heading.classList.remove('copied');
        }, 3000);
        
      } catch (fallbackErr) {
        console.error('Fallback copy method failed:', fallbackErr);
        // Last resort: show the URL for manual copying
        prompt('Copy this link:', url);
      }
    }
  }

  async waitForContentReady() {
    return new Promise((resolve) => {
      // Check if there are any re-md elements that might still be processing
      const checkContentReady = () => {
        const remdElements = this.querySelectorAll('re-md');
        
        if (remdElements.length === 0) {
          // No re-md elements, content is ready
          resolve();
        } else {
          // Wait for re-md elements to process their content
          const observer = new MutationObserver(() => {
            // Check if all re-md elements have content
            const allProcessed = Array.from(remdElements).every(el => el.children.length > 0);
            if (allProcessed) {
              observer.disconnect();
              resolve();
            }
          });
          
          // Observe each re-md element
          remdElements.forEach(el => {
            observer.observe(el, {
              childList: true,
              subtree: true
            });
          });
        }
      };
      
      // Initial check
      checkContentReady();
    });

  }
}

export default docBody